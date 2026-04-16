export class CcmError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'CcmError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class FileNotFoundError extends CcmError {
    filePath;
    constructor(filePath) {
        super(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
        this.filePath = filePath;
        this.name = 'FileNotFoundError';
    }
}
export class ValidationError extends CcmError {
    details;
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR');
        this.details = details;
        this.name = 'ValidationError';
    }
}
export class PluginInstallError extends CcmError {
    pluginName;
    constructor(pluginName, message) {
        super(`Failed to install plugin '${pluginName}': ${message}`, 'PLUGIN_INSTALL_ERROR');
        this.pluginName = pluginName;
        this.name = 'PluginInstallError';
    }
}
export class ConflictError extends CcmError {
    constructor(message) {
        super(message, 'CONFLICT_ERROR');
        this.name = 'ConflictError';
    }
}
export class NotFoundError extends CcmError {
    resource;
    identifier;
    constructor(resource, identifier) {
        super(`${resource} not found: ${identifier}`, 'NOT_FOUND');
        this.resource = resource;
        this.identifier = identifier;
        this.name = 'NotFoundError';
    }
}
//# sourceMappingURL=errors.js.map