import { Module, ModuleInitParams } from '../../types/Module';

import wasm from './xash.wasm?url'
import libmenu from './libmenu.wasm?url'
import filesystem_stdio from './filesystem_stdio.wasm?url'
import libref_gles3compat from './libref_gles3compat.wasm?url'
import libref_gl4es from './libref_gl4es.wasm?url'
import libref_soft from './libref_soft.wasm?url'
import libref_gl from './libref_gl.wasm?url'
import libref_gles1 from './libref_gles1.wasm?url'
import client_emscripten_wasm32 from './client_emscripten_wasm32.wasm?url'
import hl_emscripten_wasm32 from './hl_emscripten_wasm32.wasm?url'
import xash from './xash.js'

export const ModuleInstance = ({ ENV, reportDownloadProgress, pushMessage, canvas, onExit, ...rest }: ModuleInitParams) => {
  let module: Module;
  return xash(module = <Module>{
    print: msg => module.printErr?.(msg),
    printErr: msg => pushMessage?.(msg),
    canvas,
    preInit: [() => {
      Object.assign(module.ENV, ENV)
    }],
    dynamicLibraries: ['cl_dlls/menu_emscripten_wasm32.wasm', 'filesystem_stdio.wasm', 'libref_gl4es.wasm', 'libref_gles3compat.wasm', 'cl_dlls/client_emscripten_wasm32.wasm', 'dlls/hl_emscripten_wasm32.so'],
    preRun: [
      () => {
        module.addRunDependency('fs-sync')
        module.FS.mkdir(`${ENV.HOME}`);
        module.FS.mount(module.FS.filesystems.IDBFS, { root: '/' }, `${ENV.HOME}`);
        module.FS.syncfs(true, err => {
          if (err) throw err;
          module.removeRunDependency('fs-sync')
        });
      },
    ],
    noInitialRun: true,
    onExit,
    locateFile: (path: string) => {
      console.log(path)
      if (path.endsWith('xash.wasm')) return wasm;
      if (path.endsWith('menu_emscripten_wasm32.wasm')) return libmenu;
      if (path.endsWith('filesystem_stdio.wasm')) return filesystem_stdio;
      if (path.endsWith('libref_gles3compat.wasm')) return libref_gles3compat;
      if (path.endsWith('libref_gl4es.wasm')) return libref_gl4es;
      if (path.endsWith('libref_soft.wasm')) return libref_soft;
      if (path.endsWith('libref_gl.wasm')) return libref_gl;
      if (path.endsWith('libref_gles1.wasm')) return libref_gles1;
      if (path.endsWith('client_emscripten_wasm32.wasm')) return client_emscripten_wasm32;
      if (path.endsWith('hl_emscripten_wasm32.so')) return hl_emscripten_wasm32;
      if (path.endsWith('hl_emscripten_wasm32.so')) return hl_emscripten_wasm32;
      throw(`Unknown file[${path}] is requested by xash.js module; known urls are: ${[wasm, libmenu, filesystem_stdio, libref_gles3compat]}`);
    },
    setStatus: (status: string | {}) => {
      if (!status) return;
      if (typeof status === 'string') {
        pushMessage(status);
        const dlProgressRE = /(?<progress>\d+)\/(?<total>\d+)/ig;
        if (!dlProgressRE.test(status)) return;
        dlProgressRE.lastIndex = 0;
        const { groups: { progress, total } } = [...status.matchAll(dlProgressRE)][0] as unknown as { groups: { progress: number, total: number } };
        reportDownloadProgress?.(Math.round(progress / total * 100));
      }
    },
    ...rest
  });
}
