export interface DuktapeExport {
    destroy: () => void;
    eval: (js: string, safe?: boolean) => string;
    onMessage: (callback: (msg: string) => void) => void;
    message: (msg: string) => void;
}
export declare const uuid: () => string;
export declare const DuktapeVM: (init: string) => Promise<DuktapeExport>;
