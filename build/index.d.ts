export interface DuktapeExport {
    destroy: () => void;
    eval: (js: string, args?: any[]) => string;
    evalAsync: (js: string, args?: any[]) => Promise<string>;
    onMessage: (callback: (msg: string) => void) => void;
    message: (msg: string) => void;
    reset: (init?: string) => void;
}
export declare const uuid: () => string;
export declare const DuktapeVM: (init?: string) => Promise<DuktapeExport>;
