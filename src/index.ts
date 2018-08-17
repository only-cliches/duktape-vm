const wasm = require("../duktape/dukweb.c");

export interface DuktapeExport {
    destroy: () => void;
    eval: (js: string, safe?: boolean) => string;
}

export const DuktapeVM = function(init: string = ""):Promise<DuktapeExport> {

    return new Promise((res, rej) => {
        wasm.init().then((mod) => {

            const expo: DuktapeExport = {
                destroy: () => {
                    mod.emModule.cwrap('dukweb_close', 'void', [ ])();
                },
                eval: (code: string, safe: boolean = true): string => {
                    if (safe && (code.indexOf("emscripten_run_script") !== -1 || code.indexOf("vm_breakout") !== -1)) {
                        throw new Error("VM Security violation, unable to execute code!");
                    }
                    return (mod.emModule.cwrap('dukweb_eval', 'string', [ 'string' ]) as any)(code);
                }
            }
            
            mod.emModule.cwrap('dukweb_open', 'void', [])();
            expo.eval(`
            var exports = {}, 
                vm_breakout = this.emscripten_run_script,
                vm_args = function(args) {
                    return JSON.stringify(Array.prototype.join.call(args, ", "))
                };
            `, false);
            if (init) expo.eval(init, false);
            res(expo);
        });
    });
}

if (typeof window !== "undefined") {
    (window as any).DuktapeVM = DuktapeVM;
}