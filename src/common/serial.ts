export default <T> (funcs: (() => Promise<T>)[])  =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve<T[]>([]))
