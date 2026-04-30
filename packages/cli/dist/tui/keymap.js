export const GLOBAL_HINT_DEFS = [
    { key: '↑↓/jk', labelKey: 'footer.nav' },
    { key: 'Enter', labelKey: 'footer.enter' },
    { key: 'Esc', labelKey: 'footer.back' },
    { key: 'Tab', labelKey: 'footer.switch_focus' },
    { key: '/', labelKey: 'footer.filter' },
    { key: '?', labelKey: 'footer.help' },
    { key: 'q', labelKey: 'footer.quit' },
];
// Backward-compat alias: resolved hints (used in HelpOverlay which expects
// already-resolved label strings). The Footer now resolves via t() itself.
export const GLOBAL_HINTS = GLOBAL_HINT_DEFS.map((d) => ({
    key: d.key,
    label: d.labelKey, // HelpOverlay will display the key name; resolved at render
}));
//# sourceMappingURL=keymap.js.map