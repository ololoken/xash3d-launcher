import { Module } from '../../types/Module';

export = xash;
declare function xash(moduleArg?: Partial<Module>): Promise<Module>;
declare namespace xash {
    export { xash as default };
}
