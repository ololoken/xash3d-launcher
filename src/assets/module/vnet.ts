import { Module, SockAddr } from '../../types/Module';
import iceServers from './iceServers';
import { Payload } from '../../../server';

let hostId: number;
let _fdescriptor = 100;

const peers = new Map<string, RTCPeerConnection>();
const channels = new Map<number, RTCDataChannel>();

const sockets: Map<number, Socket> = new Map();

const send_queue: Map<string,  Array<ArrayBuffer>> = new Map();
const recv_queue: Array<{ addr: SockAddr, data: ArrayBuffer }>  = [];

export default (h: Module) => {
  const master = new WebSocket(`//${location.hostname}${import. meta.env.PROD ? '/hl' : ':4990'}`);


  const allocaddrinfo = (saddr: string, port: number) => {
    var sa, ai;
    sa = h._malloc(16);
    h.writeSockaddr(sa, 2, saddr, port);

    ai = h._malloc(32);
    h.HEAP32[((ai+4)>>2)] = 2;
    h.HEAP32[((ai+8)>>2)] = 2;
    h.HEAP32[((ai+12)>>2)] = 17;
    h.HEAPU32[((ai+24)>>2)] = 0;
    h.HEAPU32[((ai+20)>>2)] = sa;
    h.HEAP32[((ai+16)>>2)] = 16;
    h.HEAP32[((ai+28)>>2)] = 0;

    return ai;
  }

  h.net = {
    getHostId: () => hostId ? `ololoken.${hostId}` : '',

    recvfrom: (fd: number, bufPtr: number, bufLen: number, flags: number, sockaddrPtr: number, socklenPtr: number) => {
      const item = recv_queue.shift()

      if (!item) {
        h.setValue(h.___errno_location(), 73, 'i32'); // ETIMEDOUT
        return -1;
      }
      h.writeSockaddr(sockaddrPtr, 2, item.addr.addr, item.addr.port, socklenPtr);
      h.HEAPU8.set(new Uint8Array(item.data), bufPtr);
      return item.data.byteLength;
    },

    sendto: (fd: number, bufPtr: number, lenPtr: number, flags: number, sockaddrPtr: number, socklenPtr: number) => {
      const addr = h.readSockaddr(sockaddrPtr, socklenPtr);
      const data = h.HEAPU8.subarray(bufPtr, bufPtr+lenPtr);
      const peer = `${addr.addr}:${addr.port}`;

      if (addr.addr === '255.255.255.255') return data.length; // ignore broadcast packets

      const [, , a, b] = addr.addr.split('.').map(Number)
      const remoteId = (a << 0) | (b << 8);

      const key = `${hostId}:${remoteId}`;
      if (peers.has(key) && channels.has(remoteId)) {// peer connection created and data channel communication established
        channels.get(remoteId)?.send(data);
        return data.length;
      }

      const queue = send_queue.get(peer) ?? []
      queue.push(data);
      send_queue.set(peer, queue);

      if (!peers.has(key)) {// create peer connection to server
        const pc = new RTCPeerConnection({ iceServers });

        const dc = pc.createDataChannel(peer, { maxRetransmits: 0, ordered: false });

        dc.addEventListener('open', () => {
          channels.set(remoteId, dc);
          do {
            const data = send_queue.get(peer)?.shift();
            if (!data) continue;
            dc.send(data);
          } while (send_queue.get(peer)?.length)
        });
        dc.addEventListener('message', async ({ data }: MessageEvent<ArrayBuffer | Blob>) => recv_queue.push({
          addr,
          data: data instanceof Blob
            ? await data.arrayBuffer()
            : data
        })); //server response

        peers.set(key, pc);

        pc.addEventListener('icecandidate', ({ candidate }) => {
          if (!candidate) return;
          master.send(JSON.stringify({ 'pc:ice-candidate': { candidate, from: hostId, to: remoteId } }));
        });

        pc.createOffer()
          .then(sessionDescription => pc.setLocalDescription(sessionDescription))
          .then(() => master.send(JSON.stringify({ 'pc:offer': { description: pc.currentLocalDescription ?? pc.localDescription, from: hostId, to: remoteId } })));

        pc.addEventListener('connectionstatechange', () => {
          switch (pc.connectionState) {
            case 'failed': pc.restartIce(); break;
          }
        });
      }

      return data.length;
    },

    socket: (family: number, type: number, protocol: number) => {
      const sock = new Socket(family, type, protocol);
      sockets.set(sock.fd, sock);
      return sock.fd;
    },

    gethostbyname: (hostnamePtr: number) => {
      console.log('net:gethostbyname', h.AsciiToString(hostnamePtr));
      return 0;
    },

    gethostname: (namePtr: number, namelenPtr: number) => {
      h.writeArrayToMemory(h.intArrayFromString(`ololoken.${hostId}`, true), namePtr)
      return 0;
    },

    getsockname: (fd: number, sockaddrPtr: number, socklenPtr: number) => {
      const sock = sockets.get(fd);
      if (!sock) return -1;
      h.writeSockaddr(sockaddrPtr, sock.family, sock.daddr?.addr ?? '0.0.0.0', sock.daddr?.port ?? 0, socklenPtr);
      return 0;
    },

    bind: (fd: number, sockaddrPtr: number, socklenPtr: number) => {
      const sock = sockets.get(fd);
      if (!sock) return -1;
      sock.bind(h.readSockaddr(sockaddrPtr, socklenPtr));
      return 0;
    },

    closesocket: (fd: number) => {
      //todo: terminate related channels
      return sockets.delete(fd) ? 0 : -1;
    },

    getaddrinfo: (hostnamePtr: number, restrictPrt: number, hintsPtr: number, addrinfoPtr: number) => {
      const host = h.AsciiToString(hostnamePtr);
      const [name, identity] = host.split('.', 2);
      const id = Number(identity);
      h.HEAPU32[((addrinfoPtr)>>2)] = allocaddrinfo(`101.101.${(id >> 0) & 0xff}.${(id >> 8) & 0xff}`, 0);
      return 0;
    }
  }

  return new Promise<void>((resolve, reject) => {
    const onError = () => {
      reject();
    }
    master.addEventListener('error', onError);
    master.addEventListener('close', () => {

    })
    master.addEventListener('open', () => {
      master.addEventListener('message', ({ data }) => {
        const payload = <Payload>JSON.parse(data);
        switch (true) {
          case 'init' in payload: {//assign client id
            hostId = payload.init.id;
            console.log(data);
            resolve();
          } break;

          // webrtc negotiation for inbound connection
          case 'pc:ice-candidate' in payload: {
            const { candidate, from, to } = payload['pc:ice-candidate'];
            peers.get(`${to}:${from}`)?.addIceCandidate(candidate);
          } break;
          case 'pc:offer' in payload: {
            const { description, from, to } = payload['pc:offer'];
            const pc = new RTCPeerConnection({ iceServers });
            peers.set(`${to}:${from}`, pc);
            pc.setRemoteDescription(description)
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => master.send(JSON.stringify({ 'pc:answer': { description: pc.currentLocalDescription ?? pc.localDescription, from: to, to: from } })));
            pc.addEventListener('connectionstatechange', () => {
              switch (pc.connectionState) {
                case 'failed': pc.restartIce(); break;
              }
            });
            pc.addEventListener('icecandidate', ({ candidate }) => {
              if (!candidate) return;
              master.send(JSON.stringify({ 'pc:ice-candidate': { candidate, from: to, to: from } }))
            });
            pc.addEventListener('datachannel', ({ channel }) => {
              channels.set(from, channel);
              const addr = { addr: `101.101.${((from >> 0) & 0xff)}.${((from >> 8) & 0xff)}`, port: from, family: 2 }
              channel.addEventListener('message', async ({ data }: MessageEvent<ArrayBuffer | Blob>) => recv_queue.push({
                addr,
                data: data instanceof Blob
                  ? await data.arrayBuffer()
                  : data
              }));
            })
          } break;
          case 'pc:answer' in payload: {
            const { description, from, to } = payload['pc:answer'];
            peers.get(`${to}:${from}`)?.setRemoteDescription(description);
          } break;
        }
      })
    })


  })

}


class Socket {
  private readonly fdescriptor;

  private bound = false;
  public daddr?: SockAddr;

  get fd() {
    return this.fdescriptor;
  }

  constructor(
    public readonly family: number,
    public readonly type: number,
    public readonly protocol: number
  ) {
    this.fdescriptor = _fdescriptor++;
  }

  bind(addr: SockAddr) {
    this.bound = true;
    this.daddr = addr;
  }
}
