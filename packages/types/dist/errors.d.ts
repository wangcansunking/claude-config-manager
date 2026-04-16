export declare class CcmError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare class FileNotFoundError extends CcmError {
    readonly filePath: string;
    constructor(filePath: string);
}
export declare class ValidationError extends CcmError {
    readonly details?: unknown | undefined;
    constructor(message: string, details?: unknown | undefined);
}
export declare class PluginInstallError extends CcmError {
    readonly pluginName: string;
    constructor(pluginName: string, message: string);
}
export declare class ConflictError extends CcmError {
    constructor(message: string);
}
export declare class NotFoundError extends CcmError {
    readonly resource: string;
    readonly identifier: string;
    constructor(resource: string, identifier: string);
}
//# sourceMappingURL=errors.d.ts.map