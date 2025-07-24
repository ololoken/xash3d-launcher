import throwExpression from '../common/throwExpression';
import { Module } from '../types/Module';
import { BlobReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js';


const filterInput = (relativePath: string) => {
  if (relativePath.endsWith('/')) return false;
  const [fileName] = relativePath.split('/').reverse();
  return !(fileName.length === 0 || fileName.startsWith('.'));
}

const mkdirWithParents = (instance: Module) => (path: string) => {
  const parts = path.split('/');
  try { instance?.FS.lookupPath(parts.join('/')) }
  catch (ignore) {
    instance.print(`Creating new directory [${path}]`);
    parts.reduce((p, part) => {
      p = [...p, part];
      if (!part) return p;
      try { instance?.FS.lookupPath(p.join('/')) }
      catch (ignore) { instance?.FS.mkdir(p.join('/')) }
      return p;
    }, new Array<string>());
  }
}

export const directoryInputReader = async (root: string, instance: Module, files: File[]) => {
  const filtered = files.filter(({ webkitRelativePath }) => filterInput(webkitRelativePath));

  const uploaded = await Promise.all(filtered.map(file => {
    const [uri, relativePath] = getUri(`${root}`, file.webkitRelativePath, true);

    mkdirWithParents(instance)(`${root}/${relativePath}`);

    return new Promise<boolean>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('error', reject);
      reader.addEventListener('loadend', ({ target }) => {
        instance.print(`Writing file ${uri} to virtual fs from ${file.webkitRelativePath}`);
        instance.FS.writeFile(uri, new Uint8Array(target?.result as ArrayBuffer ?? throwExpression('')), { encoding: 'binary' });
        resolve(true)
      });
      reader.readAsArrayBuffer(file);
    }).catch(e => {
      console.error(e);
      return false;
    })
  }));
  return !uploaded.some(r => !r) && uploaded.length === filtered.length;
}

const getUri = (basePath: string, entryName: string, hasRoot: boolean) => {
  const [fileName, ...path] = entryName.split('/').reverse();
  let relativePath: string[];
  if (hasRoot) [, ...relativePath] = path.reverse();
  else [...relativePath] = path.reverse();

  return [`${basePath}/${relativePath.join('/')}/${fileName}`, relativePath.join('/')];
}

export const zipInputReader = (root: string, instance: Module, file: Blob) => {
  return new ZipReader(new BlobReader(file)).getEntries({
    decodeText: value => new TextDecoder().decode(value)
  })
    .then(entries => entries.filter(({ filename: relativePath }) => filterInput(relativePath)))
    .then(async filtered => {
      const hasRootFolder = Object.keys(filtered
        .reduce((names, { filename }) => ({ ...names, [`${filename.split('/').at(0)}`]: true }), <{[k: string]: boolean}>{}))
        .length === 1

      const uploaded = await Promise.all(filtered.map(entry => {
        const [uri, relativePath] = getUri(`${root}`, entry.filename, hasRootFolder);
        mkdirWithParents(instance)(`${root}/${relativePath}`);
        return entry.getData?.(new Uint8ArrayWriter).then(data => {
          instance.print(`Writing file ${uri} to virtual fs from provided zip archive`);
          instance.FS.writeFile(`${uri}`, data, { encoding: 'binary' });
        }).then(() => true)
          .catch(e => false)
      }));
      return !uploaded.some(r => !r) && uploaded.length === filtered.length
    })
}
