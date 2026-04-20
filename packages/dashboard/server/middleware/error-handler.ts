import type { ErrorRequestHandler } from 'express';
import {
  CcmError,
  ConflictError,
  FileNotFoundError,
  NotFoundError,
  PluginInstallError,
  ValidationError,
} from '@ccm/types';

/**
 * Maps a domain error to an HTTP status. Everything that isn't explicitly
 * mapped becomes a 500 — the catch-all keeps the API predictable even as new
 * CcmError subclasses are introduced.
 */
function statusFor(err: Error): number {
  if (err instanceof NotFoundError) return 404;
  if (err instanceof FileNotFoundError) return 404;
  if (err instanceof ValidationError) return 400;
  if (err instanceof ConflictError) return 409;
  if (err instanceof PluginInstallError) return 502;
  return 500;
}

function codeFor(err: Error): string | undefined {
  if (err instanceof CcmError) return err.code;
  return undefined;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = statusFor(err);
  const payload: { error: string; code?: string } = {
    error: err instanceof Error ? err.message : 'Internal server error',
  };
  const code = codeFor(err);
  if (code) payload.code = code;

  // Server-side: log with route context. 5xx always logged; 4xx logged at warn
  // level so we still see misbehaving clients without polluting the error stream.
  const logLine = `[${req.method} ${req.originalUrl}]`;
  if (status >= 500) {
    console.error(logLine, err);
  } else {
    console.warn(logLine, err instanceof Error ? err.message : err);
  }

  res.status(status).json(payload);
};
