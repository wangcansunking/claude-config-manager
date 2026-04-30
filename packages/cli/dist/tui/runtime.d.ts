export interface TerminalCapabilities {
    isTTY: boolean;
    columns: number;
    rows: number;
}
export type LaunchVerdict = {
    ok: true;
} | {
    ok: false;
    reason: 'non-tty' | 'too-small';
};
export declare function canLaunchTui(caps: TerminalCapabilities): LaunchVerdict;
export declare function runTui(): Promise<number>;
//# sourceMappingURL=runtime.d.ts.map