export interface DuktapeExport {
    destroy: () => void;
    eval: (js: string) => string;
    evalAsync: (js: string) => Promise<string>;
    onMessage: (callback: (msg: string) => void) => void;
    message: (msg: string) => void;
}
export declare const uuid: () => string;
export declare const DuktapeVM: (init?: string) => Promise<DuktapeExport>;
