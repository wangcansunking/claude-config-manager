export class CcmError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'CcmError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FileNotFoundError extends CcmError {
  constructor(public readonly filePath: string) {
    super(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
    this.name = 'FileNotFoundError';
  }
}

export class ValidationError extends CcmError {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class PluginInstallError extends CcmError {
  constructor(
    public readonly pluginName: string,
    message: string,
  ) {
    super(`Failed to install plugin '${pluginName}': ${message}`, 'PLUGIN_INSTALL_ERROR');
    this.name = 'PluginInstallError';
  }
}

export class ConflictError extends CcmError {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends CcmError {
  constructor(
    public readonly resource: string,
    public readonly identifier: string,
  ) {
    super(`${resource} not found: ${identifier}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
