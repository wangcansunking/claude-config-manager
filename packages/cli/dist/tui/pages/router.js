import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text } from 'ink';
import { Overview } from './Overview.js';
import { Profiles } from './Profiles.js';
import { Sessions } from './Sessions.js';
import { Recommended } from './Recommended.js';
import { SettingsPrefs } from './SettingsPrefs.js';
import { ConfigFrame } from './config/ConfigFrame.js';
export function renderPage(state, _store) {
    switch (state.activePage) {
        case 'overview': return _jsx(Overview, { state: state });
        case 'config': return _jsx(ConfigFrame, { state: state, store: _store });
        case 'profiles': return _jsx(Profiles, { state: state, store: _store });
        case 'sessions': return _jsx(Sessions, { state: state, store: _store });
        case 'recommended': return _jsx(Recommended, { state: state, store: _store });
        case 'settingsPrefs': return _jsx(SettingsPrefs, { state: state, store: _store });
        default: return _jsxs(Text, { dimColor: true, children: ["page: ", state.activePage, " (TODO)"] });
    }
}
//# sourceMappingURL=router.js.map