import { join } from 'path';
import { homedir } from 'os';

export function getClaudeHome(): string {
  return join(homedir(), '.claude');
}

export function claudePath(...segments: string[]): string {
  return join(getClaudeHome(), ...segments);
}
