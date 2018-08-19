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
    eval: (js: string) => string;
    evalAsync: (js: string) => Promise<string>;
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

export const DuktapeVM = function (init: string = ""): Promise<DuktapeExport> {

    const id = uuid();

    return new Promise((res, rej) => {
        wasm.init().then((mod) => {

            const expo: DuktapeExport = {
                destroy: () => {
                    delete self.duktape[id];
                    mod.emModule.cwrap('dukweb_close', 'void', [])();
                },
                evalAsync: (code: string): Promise<string> => {
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
                        expo.eval(code.replace("_success(", `exports._complete("${CBID}")(`).replace("_error(", `exports._error("${CBID}")(`));
                    });
                },
                eval: (code: string): string => {
                    return mod.emModule.cwrap('dukweb_eval', 'string', ['string'])(code);
                },
                onMessage: (callback: (msg: string) => void) => {
                    self.duktape[id].mCBs.push(callback);
                },
                message: (msg: string) => {
                    expo.eval(`_messageCBs.forEach(function(cb) { cb("${msg}") })`)
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
            expo.eval(`var setTimeout,setInterval,clearTimeout,clearInterval,_messageCBs=[],_timers={},exports={},self=this||{};!function(t){Duktape.modSearch=function(t,e,n,r){},setTimeout=function(e,n){var r=Math.round(1e5*Math.random());return _timers[r]=e,t("duktape['${id}'].timeout("+r+", "+n+")"),r},setInterval=function(e,n){var r=Math.round(1e5*Math.random());return _timers[r]=e,t("duktape['${id}'].interval("+r+", "+n+")"),r},clearTimeout=function(e){t("clearTimeout(duktape['${id}'].timers["+e+"])"),delete _timers[e]},clearInterval=function(e){t("clearInterval(duktape['${id}'].timers["+e+"])"),delete _timers[e]},exports._complete=function(e){return function(n){t("duktape['${id}'].successCBs['"+e+"']("+("string"==typeof n?"'"+n+"'":n)+")")}},exports._error=function(e){return function(n){t("duktape['${id}'].errorCBs['"+e+"']("+("string"==typeof n?"'"+n+"'":n)+")")}},exports.message=function(e){t("duktape['${id}'].mCBs.forEach(function(fn) { fn('"+e+"') })")},exports.onMessage=function(t){_messageCBs.push(t)};try{!function(){${init}}()}catch(e){t("console.error('Syntax error in VM init code!')")}}(this.emscripten_run_script),delete this.emscripten_run_script;var Promise=function(){var t=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];setTimeout(function(){!function(t){t[0].apply(null,Array.prototype.slice.call(t,1))}(t)},0)},e=function(){},n=["R"],r=["F"],o=["P"],i=function(){function t(t){this._state=o,this._queue=[],this._outcome=void 0,t!==e&&a(this,t)}return t.prototype.catch=function(t){return this.then(function(){},t)},t.prototype.then=function(i,s){if("function"!=typeof i&&this._state===r||"function"!=typeof s&&this._state===n)return this;var l=new t(e);this._state!==o?c(l,this._state===r?i:s,this._outcome):this._queue.push(new u(l,i,s));return l},t.resolve=function(n){return n instanceof this?n:s._resolve(new t(e),n)},t.reject=function(n){return s._reject(new t(e),n)},t.all=function(e){return new t(function(t,n){var r=[];if(e.length)for(var o=function(n,o,i){void 0!==i?r.push(i):r.push(o),r.length==e.length&&t(r)},i=function(t){e[t].then(function(t){o(0,t,void 0)}).catch(function(t){o(0,void 0,t)})},u=0;u<e.length;u++)i(u);else t([])})},t.race=function(n){var r,o=this,i=n.length,u=!1,c=-1,l=new t(e);if(!1!==Array.isArray(n))return this.reject(new TypeError);if(!i)return this.resolve([]);for(;++c<i;)r=n[c],o.resolve(r).then(function(t){u||(u=!0,s._resolve(l,t))},function(t){u||(u=!0,s._reject(l,t))});return l},t}();exports.Promise=i;var u=function(){function t(t,e,n){this._promise=t,"function"==typeof e&&(this._onFulfilled=e,this._callFulfilled=this._otherCallFulfilled),"function"==typeof n&&(this._onRejected=n,this._callRejected=this._otherCallRejected)}return t.prototype._callFulfilled=function(t){s._resolve(this._promise,t)},t.prototype._otherCallFulfilled=function(t){c(this._promise,this._onFulfilled,t)},t.prototype._callRejected=function(t){s._reject(this._promise,t)},t.prototype._otherCallRejected=function(t){c(this._promise,this._onRejected,t)},t}();function c(e,n,r){t(function(){var t;try{t=n.apply(null,r)}catch(t){return s._reject(e,t)}return t===e?s._reject(e,new TypeError):s._resolve(e,t),null})}exports._QueueItem=u;var s=function(){function t(){}return t._resolve=function(e,n){var o=f(l,n),i=o._value,u=-1,c=e._queue.length;if("error"===o._status)return t._reject(e,o._value);if(i)a(e,i);else for(e._state=r,e._outcome=n;++u<c;)e._queue[u]._callFulfilled(n);return e},t._reject=function(t,e){t._state=n,t._outcome=e;for(var r=-1,o=t._queue.length;++r<o;)t._queue[r]._callRejected(e);return t},t}();function l(t){var e=t&&t.then;return!t||"object"!=typeof t&&"function"!=typeof t||"function"!=typeof e?null:function(){e.apply(t,arguments)}}function a(t,e){var n=!1;function r(){for(var e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];n||(n=!0,s._reject(t,e))}function o(){for(var e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];n||(n=!0,s._resolve(t,e))}var i=f(function(){e(o,r)});"error"===i._status&&r(i._value)}function f(t,e){var n={_status:null,_value:null};try{n._value=t(e),n._status="success"}catch(t){n._status="error",n._value=t}return n}return i}();`);
            res(expo);
        });
    });
}

if (!self.duktape) {
    self.duktape = {};
    self.DuktapeVM = DuktapeVM;
}