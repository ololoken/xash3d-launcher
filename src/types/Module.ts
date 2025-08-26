export type ModuleInitParams = {
  reportDownloadProgress: (percent: number) => void
  canvas: HTMLCanvasElement
  ENV: { [key: string]: string | number }
  onExit: (code: number) => void,
  print: (msg: string) => void
  printErr: (msg: string) => void
} & Record<string, any>

export type BundleFile = { type: 'file', name: string, size: number }
type BundleDirectory = { type: 'directory', name: string, size: number, contents: BundleNode }
type BundleReport = { type: 'report', directories: number, files: number }
export type BundleNode = Array<BundleFile | BundleDirectory | BundleReport>

type WASMType = 'i8' | 'i16' | 'i32' | 'i64' | 'float' | 'double' | '*' |
                'i8*' | 'i16*' | 'i32*' | 'i64*' | 'float*' | 'double*';

export type SockAddr = { family: number, addr: string, port: number }

export type Module = {
  REMOTE_DATA_BASE_URL: string,
  REMOTE_DATA_BUNDLE: Array<BundleFile>
  ENV: { [key: string]: string | number }
  dynamicLibraries?: Array<string>
  PATH: {
    dirname: (path: string) => string
  }
  FS: {
    filesystems: { IDBFS: any, MEMFS: any }
    mkdir: (dir: string) => void
    mkdirTree: (dir: string) => void
    mount: (fs: any, options: {}, path: string) => void,
    syncfs: (syncOrCallback: boolean | ((err: any) => void), callback?: (err: any) => void) => void
    lookupPath: (path: string) => { path: string, node: FSNode }
    writeFile: (path: string, data: Uint8Array | string, options?: { encoding?: 'binary' | 'utf8' }) => void
    readFile: <B extends 'binary' | 'utf8'>(path: string, opts?: { flags?: number, encoding?: B }) => B extends 'utf8' ? string : Uint8Array<ArrayBuffer>
    stat: (path: string) => any
    unlink: (path: string) => void
    rmdir: (path: string) => void
    chdir: (path: string) => void
    open: (path: string, flags: 'r' | 'r+' | 'w' | 'w+' | 'a' | 'a+' | number, mode?: number /* 0o666 */) => FSStream
    close: (stream: FSStream) => void
    /*
    stream (object()) – The stream to read from.
    buffer (ArrayBufferView()) – The buffer to store the read data.
    offset (int()) – The offset within buffer to store the data.
    length (int()) – The length of data to write in buffer.
    position (int()) – The offset within the stream to read. By default this is the stream’s current offset.
     */
    read: (stream: FSStream, buffer: Uint8Array, offset: number, length: number, position?: number) => number

    /*
    stream (object()) – The stream to write to.
    buffer (ArrayBufferView()) – The buffer to write.
    offset (int()) – The offset within buffer to write.
    length (int()) – The length of data to write.
    position (int()) – The offset within the stream to write. By default this is the stream’s current offset.
     */
    write: (stream: FSStream, buffer: Uint8Array, offset: number, length: number, position?: number, canOwn?: boolean) => number
    analyzePath: (path: string, dontResolveLastLink?: boolean) => {
      isRoot: boolean,
      exists: boolean,
      error: Error,
      name: string,
      path: string,
      object: FSNode,
      parentExists: boolean,
      parentPath: string,
      parentObject: FSNode
    }
  }
  mainScriptUrlOrBlob: string | Blob;
  preInit: (() => void)[]
  preRun: (() => void)[]
  locateFile: (path: string) => string
  setStatus: (status: string | Object) => void
  addRunDependency: (dep: string) => void
  removeRunDependency: (dep: string) => void
  print: (msg: string) => void
  printErr: (msg: string) => void
  canvas: HTMLCanvasElement
  onExit: (code: number) => void
  noInitialRun: boolean
  run: () => void
  callMain: (args?: Array<number | string>) => void

  getValue: (ptr: number, type: WASMType /* 'i8' */) => number
  setValue: (ptr: number, value: number, type: WASMType /* 'i8' */) => void

  writeArrayToMemory: (array: ArrayLike<number>, buffer: number) => void

  UTF8ToString: (ptr: number, len?: number) => string
  stringToUTF8: (str: string, outPtr: number, maxBytesToWrite: number) => number

  net: any;

  inetNtop4: (addr: number) => string
  inetPton4: (addr: string) => number
  readSockaddr: (sa: number, salen: number) => SockAddr
  writeSockaddr: (sa: number, family: number, addr: string, port: number, addrlen?: number) => number

  AsciiToString: (ptr: number) => string
  intArrayFromString: (stringy: string, dontAddNull?: boolean, length?: number) => Int8Array<ArrayBufferLike>

  DNS: {
    lookup_name: (name: string) => string
  }

  HEAP8: Int8Array
  HEAPU8: Uint8Array
  HEAP32: Int32Array
  HEAPU32: Uint32Array

  _maloc: (size: number) => number;

  ccal: (exportName: string, exportReturn: 'number' | 'string', argTypes: ('number' | 'string')[], args: (number | string)[]) => number | string

} & Record<string, any>

export type FSStream = {
  object: FSNode
  isRead: boolean
  isWrite: boolean
  isAppend: boolean
  flags: number
  position: number
}

type FSNode = {
  node_ops: {}
  stream_ops: {};
  readMode: number
  writeMode: number
  mounted: {} | null

  contents: {
    [name: string]: FSNode
  } | Int8Array

  /* unix timestamps */
  atime: number
  ctime: number
  mtime: number

  name: string

  id: number

  mount?: {
    mountpoint: string
    mounts: Array<any>
    opts: { root: string }
    root: FSNode
  }

  parent?: FSNode

  get read(): boolean
  set read(val)
  get write(): boolean
  set write(val)
  get isFolder(): boolean
  get isDevice(): boolean
}

type FSStat = {
  atime: Date
  ctime: Date
  mtime: Date

  blksize: number
  blocks: 1
  dev: number
  gid: 0
  uid: 0
  ino: number
  mode: number
  nlink: number
  rdev: number
  size: number
}
