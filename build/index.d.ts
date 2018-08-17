export interface DuktapeExport {
    destroy: () => void;
    eval: (js: string, safe?: boolean) => string;
}
export declare const DuktapeVM: (init?: string) => Promise<DuktapeExport>;
