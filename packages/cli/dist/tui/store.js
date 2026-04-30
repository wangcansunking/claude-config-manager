import { create } from 'zustand';
import { homedir } from 'os';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { PluginManager, McpManager, SkillScanner, ConfigManager, ProfileManager, SessionManager, getClaudeHome, } from '@ccm/core';
export function createStore() {
    const home = getClaudeHome();
    const pluginMgr = new PluginManager(home);
    const mcpMgr = new McpManager(home);
    const skillScan = new SkillScanner(home);
    const configMgr = new ConfigManager(home);
    const profileMgr = new ProfileManager(home);
    const sessionMgr = new SessionManager(home);
    async function safe(section, fn, fallback) {
        try {
            return { value: await fn() };
        }
        catch (e) {
            return { value: fallback, error: { section, err: e } };
        }
    }
    return create((set, _get) => ({
        plugins: [], mcpServers: [], skills: [], commands: [],
        settings: {}, profiles: [], activeProfile: null,
        sessions: [], recommendations: [],
        dashboardStatus: { running: false },
        sessionHistories: new Map(),
        activePage: 'overview',
        configInnerTab: 'plugins',
        focused: 'sidebar',
        pendingActions: new Set(),
        toasts: [],
        modal: null,
        loading: {},
        lastError: null,
        async init() {
            set({
                loading: {
                    plugins: true, mcpServers: true, skills: true, commands: true,
                    settings: true, profiles: true, sessions: true,
                },
            });
            const [plugins, mcps, skills, commands, settings, profiles, sessions, activeProfile,] = await Promise.all([
                safe('plugins', () => pluginMgr.list(), []),
                safe('mcpServers', () => mcpMgr.list(), []),
                safe('skills', () => skillScan.scan(), []),
                safe('commands', () => skillScan.scanCommands(), []),
                safe('settings', () => configMgr.getSettings(), {}),
                safe('profiles', () => profileMgr.list(), []),
                safe('sessions', async () => {
                    const all = await sessionMgr.listAllSessions();
                    return all.slice(0, 50);
                }, []),
                safe('profiles', () => profileMgr.getActive(), null),
            ]);
            const firstError = plugins.error ?? mcps.error ?? skills.error ?? commands.error
                ?? settings.error ?? profiles.error ?? sessions.error ?? null;
            set({
                plugins: plugins.value,
                mcpServers: mcps.value,
                skills: skills.value,
                commands: commands.value,
                settings: settings.value,
                profiles: profiles.value,
                sessions: sessions.value,
                activeProfile: activeProfile.value,
                loading: {},
                lastError: firstError,
            });
        },
        async refresh(section) {
            const targets = section ? [section] : [
                'plugins', 'mcpServers', 'skills', 'commands', 'settings', 'profiles', 'sessions',
            ];
            set((s) => ({
                loading: targets.reduce((acc, t) => ({ ...acc, [t]: true }), s.loading),
            }));
            for (const t of targets) {
                try {
                    switch (t) {
                        case 'plugins':
                            set({ plugins: await pluginMgr.list() });
                            break;
                        case 'mcpServers':
                            set({ mcpServers: await mcpMgr.list() });
                            break;
                        case 'skills':
                            set({ skills: await skillScan.scan() });
                            break;
                        case 'commands':
                            set({ commands: await skillScan.scanCommands() });
                            break;
                        case 'settings':
                            set({ settings: await configMgr.getSettings() });
                            break;
                        case 'profiles':
                            set({
                                profiles: await profileMgr.list(),
                                activeProfile: await profileMgr.getActive(),
                            });
                            break;
                        case 'sessions': {
                            const all = await sessionMgr.listAllSessions();
                            set({ sessions: all.slice(0, 50) });
                            break;
                        }
                    }
                }
                catch (e) {
                    set({ lastError: { section: t, err: e } });
                }
            }
            set((s) => {
                const loading = { ...s.loading };
                for (const t of targets)
                    delete loading[t];
                return { loading };
            });
        },
        async loadRecommendations() {
            const path = join(homedir(), '.claude/plugins/ccm-cache/recommendations.json');
            try {
                const raw = await readFile(path, 'utf-8');
                const json = JSON.parse(raw);
                set({ recommendations: json.recommendations ?? [] });
            }
            catch {
                set({ recommendations: [] });
            }
        },
        async loadSessionHistory(historyFile) {
            // Cache hit — skip
            if (_get().sessionHistories.has(historyFile))
                return;
            try {
                const history = await sessionMgr.getSessionHistory(historyFile, 20);
                const truncated = history.map((h) => ({
                    ...h,
                    text: h.text.length > 200 ? h.text.slice(0, 200) + '…' : h.text,
                }));
                set((s) => {
                    const next = new Map(s.sessionHistories);
                    next.set(historyFile, truncated);
                    return { sessionHistories: next };
                });
            }
            catch (e) {
                // On error store empty array so we don't retry on every cursor move
                set((s) => {
                    const next = new Map(s.sessionHistories);
                    next.set(historyFile, []);
                    return { sessionHistories: next, lastError: { section: 'sessions', err: e } };
                });
            }
        },
        setPage(p) { set({ activePage: p }); },
        setInnerTab(t) { set({ configInnerTab: t }); },
        setFocus(f) { set({ focused: f }); },
        pushToast(t) {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        },
        dismissToast(id) { set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })); },
        openModal(m) { set({ modal: m }); },
        closeModal() { set({ modal: null }); },
        async togglePlugin(name) {
            const cur = _get().plugins.find((p) => p.name === name);
            if (!cur)
                return;
            const next = !cur.enabled;
            // optimistic
            set((s) => ({
                plugins: s.plugins.map((p) => p.name === name ? { ...p, enabled: next } : p),
                pendingActions: new Set(s.pendingActions).add(`plugin:${name}`),
            }));
            try {
                await pluginMgr.toggle(name, next);
                _get().pushToast({
                    kind: 'success',
                    text: `${next ? 'Enabled' : 'Disabled'} ${name}`,
                });
            }
            catch (e) {
                set((s) => ({
                    plugins: s.plugins.map((p) => p.name === name ? { ...p, enabled: cur.enabled } : p),
                    lastError: { section: 'plugins', err: e },
                }));
                _get().pushToast({
                    kind: 'error',
                    text: `Failed to toggle ${name}: ${e.message}`,
                });
            }
            finally {
                set((s) => {
                    const n = new Set(s.pendingActions);
                    n.delete(`plugin:${name}`);
                    return { pendingActions: n };
                });
            }
        },
        async toggleMcp(name) {
            const cur = _get().mcpServers.find((m) => m.name === name);
            if (!cur)
                return;
            const next = !cur.enabled;
            set((s) => ({
                mcpServers: s.mcpServers.map((m) => m.name === name ? { ...m, enabled: next } : m),
                pendingActions: new Set(s.pendingActions).add(`mcp:${name}`),
            }));
            try {
                await mcpMgr.toggle(name, next);
                _get().pushToast({ kind: 'success', text: `${next ? 'Enabled' : 'Disabled'} ${name}` });
            }
            catch (e) {
                set((s) => ({
                    mcpServers: s.mcpServers.map((m) => m.name === name ? { ...m, enabled: cur.enabled } : m),
                    lastError: { section: 'mcpServers', err: e },
                }));
                _get().pushToast({ kind: 'error', text: `Failed: ${e.message}` });
            }
            finally {
                set((s) => {
                    const n = new Set(s.pendingActions);
                    n.delete(`mcp:${name}`);
                    return { pendingActions: n };
                });
            }
        },
        async toggleSkill(id) {
            // NOTE: SkillDefinition uses `name` as identifier; `id` param maps to `name`
            const cur = _get().skills.find((s) => s.name === id);
            if (!cur)
                return;
            const curEnabled = cur.enabled ?? true;
            const next = !curEnabled;
            set((s) => ({
                skills: s.skills.map((sk) => sk.name === id ? { ...sk, enabled: next } : sk),
                pendingActions: new Set(s.pendingActions).add(`skill:${id}`),
            }));
            try {
                await skillScan.toggle(cur.name, next);
                _get().pushToast({ kind: 'success', text: `${next ? 'Enabled' : 'Disabled'} ${cur.name}` });
            }
            catch (e) {
                set((s) => ({
                    skills: s.skills.map((sk) => sk.name === id ? { ...sk, enabled: curEnabled } : sk),
                    lastError: { section: 'skills', err: e },
                }));
                _get().pushToast({ kind: 'error', text: `Failed: ${e.message}` });
            }
            finally {
                set((s) => {
                    const n = new Set(s.pendingActions);
                    n.delete(`skill:${id}`);
                    return { pendingActions: n };
                });
            }
        },
        async switchProfile(name) {
            const prev = _get().activeProfile;
            set((s) => ({
                activeProfile: name,
                pendingActions: new Set(s.pendingActions).add(`profile:switch:${name}`),
            }));
            try {
                await profileMgr.activate(name);
                _get().pushToast({ kind: 'success', text: `Switched to ${name}` });
            }
            catch (e) {
                set({ activeProfile: prev, lastError: { section: 'profiles', err: e } });
                _get().pushToast({ kind: 'error', text: `Switch failed: ${e.message}` });
            }
            finally {
                set((s) => {
                    const n = new Set(s.pendingActions);
                    n.delete(`profile:switch:${name}`);
                    return { pendingActions: n };
                });
            }
        },
        async setModel(model) {
            const prev = _get().settings.model;
            set((s) => ({ settings: { ...s.settings, model } }));
            try {
                await configMgr.setModel(model);
                _get().pushToast({ kind: 'success', text: `Model: ${model}` });
            }
            catch (e) {
                set((s) => ({ settings: { ...s.settings, model: prev }, lastError: { section: 'settings', err: e } }));
                _get().pushToast({ kind: 'error', text: e.message });
            }
        },
        async setLanguage(lang) {
            const env = (_get().settings.env ?? {});
            const prev = env.CLAUDE_CONFIG_LANG;
            set((s) => ({ settings: { ...s.settings, env: { ...env, CLAUDE_CONFIG_LANG: lang } } }));
            try {
                await configMgr.setEnvVar('CLAUDE_CONFIG_LANG', lang);
                _get().pushToast({ kind: 'success', text: `Language: ${lang}` });
            }
            catch (e) {
                set((s) => ({
                    settings: {
                        ...s.settings,
                        env: { ...env, CLAUDE_CONFIG_LANG: prev ?? 'en' },
                    },
                    lastError: { section: 'settings', err: e },
                }));
                _get().pushToast({ kind: 'error', text: e.message });
            }
        },
    }));
}
//# sourceMappingURL=store.js.map