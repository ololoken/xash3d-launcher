import { WebSocketServer, RawData, WebSocket } from 'ws';

export type Payload =
    { 'init': { id: number } }
  | { 'pc:ice-candidate': { candidate: RTCIceCandidateInit, from: number, to: number } }
  | { 'pc:offer': { description: RTCSessionDescription, from: number, to: number } }
  | { 'pc:answer': { description: RTCSessionDescription, from: number, to: number } }
  | { 'public': { status: boolean } }
  | { 'list': '' }
  | { 'sv:list': number[] }

const instances = new Map<number, WebSocket>;
const publicInstances = new Set<number>;

const wss = new WebSocketServer({ port: 4990 });

const sendPublicInstances = () =>
  instances.forEach(socket => socket.send(JSON.stringify({ 'sv:list': Array.from(publicInstances) })));

wss.on('connection', (ws, req) => {

  const id = (() => {
    let id;
    do {
      id = Math.floor(Math.random() * 9000) + 1000;
    } while (instances.has(id));
    return id;
  })();

  instances.set(id, ws)

  ws.on('close', () => {
    instances.delete(id);
    if (publicInstances.delete(id)) {
      sendPublicInstances();
    }
  })

  ws.on('error', err => {
    console.error(err);
    ws.close();
  });


  ws.on('message', (data: RawData, isBinary: boolean) => {
    try {
      const payload = <Payload>JSON.parse(data.toString());
      switch (true) {
        case 'pc:ice-candidate' in payload: {
          const { to } = payload['pc:ice-candidate'];
          instances.get(to)?.send(JSON.stringify(payload));
        } break;
        case 'pc:offer' in payload: {
          const { to } = payload['pc:offer'];
          instances.get(to)?.send(JSON.stringify(payload));
        } break;
        case 'pc:answer' in payload: {
          const { to } = payload['pc:answer'];
          instances.get(to)?.send(JSON.stringify(payload));
        } break;
        case 'public' in payload: {// mark instance as public
          if (payload['public'].status) {
            publicInstances.add(id);
          }
          else {
            publicInstances.delete(id);
          }
        } break;
        case 'list' in payload: {
          sendPublicInstances();
        } break;
        default: throw 'not_supported'
      }
    }
    catch (e) {
      ws.close(3000, typeof e === 'string'
        ? e
        : (e instanceof Error
          ? e.message
          : 'unknown_error'
        ))
    }
  });

  ws.send(JSON.stringify({ init: { id } }));
});
