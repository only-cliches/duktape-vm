const wasm = require("../duktape/dukweb.c");

const self: {
    duktape: {
        [vmID: string]: {
            mCBs: ((msg: string) => void)[];
            timeout: (timerID: number, timeout: number) => void;
            interval: (timerID: number, timeout: number) => void;
            timers: { [vmID: number]: any };
            successCBs: { [cbID: string]: (result?: string) => void }
            errorCBs: { [cbID: string]: (result?: string) => void }
        }
    },
    DuktapeVM: any;
} = ((typeof window !== "undefined" ? window : global) as any) || {};

export interface DuktapeExport {
    destroy: () => void;
    eval: (js: string, args?: any[]) => string;
    evalAsync: (js: string, args?: any[]) => Promise<string>;
    onMessage: (callback: (msg: string) => void) => void;
    message: (msg: string) => void;
    reset: (init?: string) => void;
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

const env = (id, init: string) => {
    return `var setTimeout,setInterval,clearTimeout,clearInterval,_messageCBs=[],_timers={},exports={},self=this||{};!function(e){Duktape.modSearch=function(e,t,n,r){},setTimeout=function(t,n){var r=Math.round(1e5*Math.random());return _timers[r]=t,e("duktape['${id}'].timeout("+r+", "+n+")"),r},setInterval=function(t,n){var r=Math.round(1e5*Math.random());return _timers[r]=t,e("duktape['${id}'].interval("+r+", "+n+")"),r},clearTimeout=function(t){e("clearTimeout(duktape['${id}'].timers["+t+"])"),delete _timers[t]},clearInterval=function(t){e("clearInterval(duktape['${id}'].timers["+t+"])"),delete _timers[t]},exports._complete=function(t){return function(n){var r="string"==typeof n?"'"+n.replace(/\'/gim,"\\'")+"'":n;e("duktape['${id}'].successCBs['"+t+"']("+r+")")}},exports._error=function(t){return function(n){var r="string"==typeof n?"'"+n.replace(/\'/gim,"\\'")+"'":n;e("duktape['${id}'].errorCBs['"+t+"']("+r+")")}},exports.message=function(t){e("duktape['${id}'].mCBs.forEach(function(fn) { fn('"+t.replace(/\'/gim,"\\'")+"') })")},exports.onMessage=function(e){_messageCBs.push(e)};try{!function(){${init}}()}catch(t){e("console.error('Syntax error in VM init code!')")}}(this.emscripten_run_script),delete this.emscripten_run_script;var Promise=function(){var e=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];setTimeout(function(){!function(e){e[0].apply(null,Array.prototype.slice.call(e,1))}(e)},0)},t=function(){},n=["R"],r=["F"],o=["P"],i=function(){function e(e){this._state=o,this._queue=[],this._outcome=void 0,e!==t&&a(this,e)}return e.prototype.catch=function(e){return this.then(function(){},e)},e.prototype.then=function(i,s){if("function"!=typeof i&&this._state===r||"function"!=typeof s&&this._state===n)return this;var l=new e(t);this._state!==o?c(l,this._state===r?i:s,this._outcome):this._queue.push(new u(l,i,s));return l},e.resolve=function(n){return n instanceof this?n:s._resolve(new e(t),n)},e.reject=function(n){return s._reject(new e(t),n)},e.all=function(t){return new e(function(e,n){var r=[];if(t.length)for(var o=function(n,o,i){void 0!==i?r.push(i):r.push(o),r.length==t.length&&e(r)},i=function(e){t[e].then(function(e){o(0,e,void 0)}).catch(function(e){o(0,void 0,e)})},u=0;u<t.length;u++)i(u);else e([])})},e.race=function(n){var r,o=this,i=n.length,u=!1,c=-1,l=new e(t);if(!1!==Array.isArray(n))return this.reject(new TypeError);if(!i)return this.resolve([]);for(;++c<i;)r=n[c],o.resolve(r).then(function(e){u||(u=!0,s._resolve(l,e))},function(e){u||(u=!0,s._reject(l,e))});return l},e}();exports.Promise=i;var u=function(){function e(e,t,n){this._promise=e,"function"==typeof t&&(this._onFulfilled=t,this._callFulfilled=this._otherCallFulfilled),"function"==typeof n&&(this._onRejected=n,this._callRejected=this._otherCallRejected)}return e.prototype._callFulfilled=function(e){s._resolve(this._promise,e)},e.prototype._otherCallFulfilled=function(e){c(this._promise,this._onFulfilled,e)},e.prototype._callRejected=function(e){s._reject(this._promise,e)},e.prototype._otherCallRejected=function(e){c(this._promise,this._onRejected,e)},e}();function c(t,n,r){e(function(){var e;try{e=n.apply(null,r)}catch(e){return s._reject(t,e)}return e===t?s._reject(t,new TypeError):s._resolve(t,e),null})}exports._QueueItem=u;var s=function(){function e(){}return e._resolve=function(t,n){var o=f(l,n),i=o._value,u=-1,c=t._queue.length;if("error"===o._status)return e._reject(t,o._value);if(i)a(t,i);else for(t._state=r,t._outcome=n;++u<c;)t._queue[u]._callFulfilled(n);return t},e._reject=function(e,t){e._state=n,e._outcome=t;for(var r=-1,o=e._queue.length;++r<o;)e._queue[r]._callRejected(t);return e},e}();function l(e){var t=e&&e.then;return!e||"object"!=typeof e&&"function"!=typeof e||"function"!=typeof t?null:function(){t.apply(e,arguments)}}function a(e,t){var n=!1;function r(){for(var t=[],r=0;r<arguments.length;r++)t[r]=arguments[r];n||(n=!0,s._reject(e,t))}function o(){for(var t=[],r=0;r<arguments.length;r++)t[r]=arguments[r];n||(n=!0,s._resolve(e,t))}var i=f(function(){t(o,r)});"error"===i._status&&r(i._value)}function f(e,t){var n={_status:null,_value:null};try{n._value=e(t),n._status="success"}catch(e){n._status="error",n._value=e}return n}return i}();`;
}

export const DuktapeVM = function (init: string = ""): Promise<DuktapeExport> {

    const id = uuid();

    return new Promise((res, rej) => {
        wasm.init().then((mod) => {

            const expo: DuktapeExport = {
                destroy: () => {
                    delete self.duktape[id];
                    mod.emModule.cwrap('dukweb_close', 'void', [])();
                },
                evalAsync: (code: string, args: any[] = []): Promise<string> => {
                    return new Promise((res, rej) => {
                        let CBID = uuid();
                        self.duktape[id].successCBs[CBID] = (result: any) => {
                            delete self.duktape[id].errorCBs[CBID];
                            delete self.duktape[id].successCBs[CBID];
                            res(result);
                        }
                        self.duktape[id].errorCBs[CBID] = (err: any) => {
                            delete self.duktape[id].errorCBs[CBID];
                            delete self.duktape[id].successCBs[CBID];
                            rej(err);
                        }
                        const asyncCode = code.replace("_success(", `exports._complete("${CBID}")(`).replace("_error(", `exports._error("${CBID}")(`);
                        expo.eval(asyncCode, args);
                    });
                },
                eval: (code: string, args: any[] = []): string => {
                    if (args.length > 0) {
                        return mod.emModule.cwrap('dukweb_eval', 'string', ['string'])(`(function(args) { ${code} })(${JSON.stringify(args)});`);
                    } else {
                        return mod.emModule.cwrap('dukweb_eval', 'string', ['string'])(code);
                    }
                },
                onMessage: (callback: (msg: string) => void) => {
                    self.duktape[id].mCBs.push(callback);
                },
                message: (msg: string) => {
                    expo.eval(`_messageCBs.forEach(function(cb) { cb("${msg}") })`)
                },
                reset: (resetInit?: string) => {
                    mod.emModule.cwrap('dukweb_close', 'void', [])();
                    mod.emModule.cwrap('dukweb_open', 'void', [])();
                    expo.eval(env(id, resetInit || init));
                }
            }

            self.duktape[id] = {
                mCBs: [],
                timeout: (timerID: number, time: number) => {
                    self.duktape[id].timers[timerID] = setTimeout(() => {
                        expo.eval(`if (_timers[${timerID}]) { _timers[${timerID}](); delete _timers[${timerID}]; }`);
                    }, time);
                },
                interval: (timerID: number, time: number) => {
                    self.duktape[id].timers[timerID] = setInterval(() => {
                        expo.eval(`if (_timers[${timerID}]) { _timers[${timerID}](); }`);
                    }, time);
                },
                timers: {},
                successCBs: {},
                errorCBs: {}
            }

            mod.emModule.cwrap('dukweb_open', 'void', [])();
            expo.eval(env(id, init));
            res(expo);
        });
    });
}

if (!self.duktape) {
    self.duktape = {};
    self.DuktapeVM = DuktapeVM;
}