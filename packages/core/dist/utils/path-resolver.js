import { join } from 'path';
import { homedir } from 'os';
export function getClaudeHome() {
    return join(homedir(), '.claude');
}
export function claudePath(...segments) {
    return join(getClaudeHome(), ...segments);
}
//# sourceMappingURL=path-resolver.js.map