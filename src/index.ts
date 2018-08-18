const wasm = require("../duktape/dukweb.c");

const self: any = (typeof window !== "undefined" ? window : global);

export interface DuktapeExport {
    destroy: () => void;
    eval: (js: string) => string;
    onMessage: (callback: (msg: string) => void) => void;
    message: (msg: string) => void;
}

export const uuid = (): string => {
    let r, s, b = "";
    return [b, b, b, b, b, b, b, b].reduce((prev: string, cur: any, i: number): string => {
        r = Math.round(Math.random() * Math.pow(2, 16));
        s = (i === 3 ? 4 : (i === 4 ? (r % 16 & 0x3 | 0x8).toString(16) : b));
        r = r.toString(16);
        while (r.length < 4) r = "0" + r;
        return prev + ([2, 3, 4, 5].indexOf(i) > -1 ? "-" : b) + (s + r).slice(0, 4);
    }, b);
};

export const DuktapeVM = function(init: string):Promise<DuktapeExport> {

    const id = uuid();

    self.duktape[id] = [];

    return new Promise((res, rej) => {
        wasm.init().then((mod) => {

            const expo: DuktapeExport = {
                destroy: () => {
                    delete self.duktape[id];

                    mod.emModule.cwrap('dukweb_close', 'void', [ ])();
                },
                eval: (code: string): string => {
                    return mod.emModule.cwrap('dukweb_eval', 'string', [ 'string' ])(code);
                },
                onMessage: (callback: (msg: string) => void) => {
                    self.duktape[id].push(callback);
                },
                message: (msg: string) => {
                    expo.eval(`_messageCBs.forEach(function(cb) { cb("${msg}") })`)
                }
            }
            
            mod.emModule.cwrap('dukweb_open', 'void', [])();
            expo.eval(`
            var _messageCBs = [];
            var exports = {};
            var vm_args = function(args) {
                return JSON.stringify(Array.prototype.join.call(args, ", "))
            };

            (function(vm_breakout) {

                exports.message = function(message) {
                    vm_breakout("duktape['${id}'].forEach(function(fn) { fn('" + message + "') })");
                }
                exports.onMessage = function(cb) {
                    _messageCBs.push(cb);
                }

                try {
                    ${init || ""}
                } catch(e) {
                    vm_breakout("console.error('Syntax error in VM init code!')");
                }
                
            })(this.emscripten_run_script);

            delete this.emscripten_run_script;
            `);
            res(expo);
        });
    });
}

if (!self.duktape) {
    self.duktape = {};
    self.DuktapeVM = DuktapeVM;
}