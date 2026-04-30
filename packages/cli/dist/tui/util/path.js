import { homedir } from 'os';
const HOME = homedir();
/**
 * Replace the user's home directory prefix in an absolute path with `~`.
 * Returns the input unchanged if it doesn't start with $HOME.
 */
export function tildify(p) {
    if (!p)
        return '';
    if (p === HOME)
        return '~';
    if (p.startsWith(HOME + '/'))
        return '~' + p.slice(HOME.length);
    return p;
}
//# sourceMappingURL=path.js.map