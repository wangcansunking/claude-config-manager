import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { homedir } from 'os';
import { join } from 'path';
import { readFile } from 'fs/promises';
import {
  PluginManager,
  McpManager,
  SkillScanner,
  ConfigManager,
  ProfileManager,
  SessionManager,
  getClaudeHome,
  type ProfileSummary,
} from '@ccm/core';
import type {
  PluginListEntry,
  McpServerEntry,
  SkillDefinition,
  CommandDefinition,
} from '@ccm/types';
import { t } from './i18n.js';

// SettingsRecord is defined locally in ConfigManager — re-alias here
type SettingsRecord = Record<string, unknown>;

// SessionInfo is the real return type from SessionManager.listAllSessions()
type SessionInfo = Awaited<ReturnType<SessionManager['listAllSessions']>>[number];

// Matches SessionHistoryEntry from @ccm/core but uses the actual field names
export interface SessionHistoryEntry {
  role: string;
  text: string;        // content of the message (field name from core is `text`)
  timestamp: string;
}

export type Section =
  | 'plugins' | 'mcpServers' | 'skills' | 'commands'
  | 'settings' | 'profiles' | 'sessions' | 'recommendations'
  | 'dashboardStatus';

export type PageId =
  | 'overview' | 'profiles' | 'sessions' | 'recommended'
  | 'settingsPrefs' | 'config';

export type ConfigInnerTab = 'plugins' | 'mcps' | 'skills' | 'commands' | 'settings';

export interface Toast {
  id: string;
  kind: 'info' | 'success' | 'error';
  text: string;
}

export interface ModalDescriptor {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
}

export interface DashboardStatus {
  running: boolean;
  pid?: number;
  port?: number;
}

export interface StoreState {
  // data
  plugins:         PluginListEntry[];
  mcpServers:      McpServerEntry[];
  skills:          SkillDefinition[];
  commands:        CommandDefinition[];
  settings:        SettingsRecord;
  profiles:        ProfileSummary[];
  activeProfile:   string | null;
  sessions:        SessionInfo[];
  recommendations: unknown[];
  dashboardStatus: DashboardStatus;

  // ui
  activePage:      PageId;
  configInnerTab:  ConfigInnerTab;
  focused:         'sidebar' | 'main';
  pendingActions:  Set<string>;
  toasts:          Toast[];
  modal:           ModalDescriptor | null;
  loading:         Partial<Record<Section, boolean>>;
  lastError:       { section: Section; err: Error } | null;

  // session history cache — keyed by historyFile path
  sessionHistories: Map<string, SessionHistoryEntry[]>;

  // actions
  init():                                    Promise<void>;
  refresh(section?: Section):                Promise<void>;
  loadRecommendations():                     Promise<void>;
  loadSessionHistory(historyFile: string):   Promise<void>;
  setPage(p: PageId):                        void;
  setInnerTab(t: ConfigInnerTab):            void;
  setFocus(f: 'sidebar' | 'main'):           void;
  pushToast(t: Omit<Toast, 'id'>):           void;
  dismissToast(id: string):                  void;
  openModal(m: ModalDescriptor):             void;
  closeModal():                              void;

  // mutations
  togglePlugin(name: string):                Promise<void>;
  toggleMcp(name: string):                   Promise<void>;
  toggleSkill(id: string):                   Promise<void>;
  switchProfile(name: string):               Promise<void>;
  setModel(model: string):                   Promise<void>;
  setLanguage(lang: 'en' | 'zh'):            Promise<void>;
}

export type CcmStore = UseBoundStore<StoreApi<StoreState>>;

export function createStore(): CcmStore {
  const home = getClaudeHome();
  const pluginMgr  = new PluginManager(home);
  const mcpMgr     = new McpManager(home);
  const skillScan  = new SkillScanner(home);
  const configMgr  = new ConfigManager(home);
  const profileMgr = new ProfileManager(home);
  const sessionMgr = new SessionManager(home);

  async function safe<T>(
    section: Section,
    fn: () => Promise<T>,
    fallback: T,
  ): Promise<{ value: T; error?: { section: Section; err: Error } }> {
    try {
      return { value: await fn() };
    } catch (e) {
      return { value: fallback, error: { section, err: e as Error } };
    }
  }

  return create<StoreState>((set, _get) => ({
    plugins: [], mcpServers: [], skills: [], commands: [],
    settings: {} as SettingsRecord, profiles: [], activeProfile: null,
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

      const [
        plugins, mcps, skills, commands, settings,
        profiles, sessions, activeProfile,
      ] = await Promise.all([
        safe('plugins',     () => pluginMgr.list(),        []),
        safe('mcpServers',  () => mcpMgr.list(),           []),
        safe('skills',      () => skillScan.scan(),          []),
        safe('commands',    () => skillScan.scanCommands(),  []),
        safe('settings',    () => configMgr.getSettings(), {} as SettingsRecord),
        safe('profiles',    () => profileMgr.list(),       []),
        safe('sessions',    async () => {
          const all = await sessionMgr.listAllSessions();
          return all.slice(0, 50);
        }, []),
        safe('profiles',    () => profileMgr.getActive(),  null as string | null),
      ]);

      const firstError =
        plugins.error ?? mcps.error ?? skills.error ?? commands.error
        ?? settings.error ?? profiles.error ?? sessions.error ?? null;

      set({
        plugins:        plugins.value,
        mcpServers:     mcps.value,
        skills:         skills.value,
        commands:       commands.value,
        settings:       settings.value,
        profiles:       profiles.value,
        sessions:       sessions.value,
        activeProfile:  activeProfile.value,
        loading:        {},
        lastError:      firstError,
      });
    },

    async refresh(section?: Section) {
      const targets: Section[] = section ? [section] : [
        'plugins', 'mcpServers', 'skills', 'commands', 'settings', 'profiles', 'sessions',
      ];
      set((s) => ({
        loading: targets.reduce((acc, t) => ({ ...acc, [t]: true }), s.loading),
      }));

      for (const t of targets) {
        try {
          switch (t) {
            case 'plugins':
              set({ plugins: await pluginMgr.list() });   break;
            case 'mcpServers':
              set({ mcpServers: await mcpMgr.list() });   break;
            case 'skills':
              set({ skills: await skillScan.scan() }); break;
            case 'commands':
              set({ commands: await skillScan.scanCommands() }); break;
            case 'settings':
              set({ settings: await configMgr.getSettings() }); break;
            case 'profiles':
              set({
                profiles: await profileMgr.list(),
                activeProfile: await profileMgr.getActive(),
              }); break;
            case 'sessions': {
              const all = await sessionMgr.listAllSessions();
              set({ sessions: all.slice(0, 50) }); break;
            }
          }
        } catch (e) {
          set({ lastError: { section: t, err: e as Error } });
        }
      }

      set((s) => {
        const loading = { ...s.loading };
        for (const t of targets) delete loading[t];
        return { loading };
      });
    },

    async loadRecommendations() {
      const path = join(homedir(), '.claude/plugins/ccm-cache/recommendations.json');
      try {
        const raw = await readFile(path, 'utf-8');
        const json = JSON.parse(raw);
        set({ recommendations: json.recommendations ?? [] });
      } catch {
        set({ recommendations: [] });
      }
    },

    async loadSessionHistory(historyFile: string) {
      // Cache hit — skip
      if (_get().sessionHistories.has(historyFile)) return;
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
      } catch (e) {
        // On error store empty array so we don't retry on every cursor move
        set((s) => {
          const next = new Map(s.sessionHistories);
          next.set(historyFile, []);
          return { sessionHistories: next, lastError: { section: 'sessions', err: e as Error } };
        });
      }
    },

    setPage(p)        { set({ activePage: p }); },
    setInnerTab(t)    { set({ configInnerTab: t }); },
    setFocus(f)       { set({ focused: f }); },
    pushToast(t) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    },
    dismissToast(id)  { set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })); },
    openModal(m)      { set({ modal: m }); },
    closeModal()      { set({ modal: null }); },

    async togglePlugin(name: string) {
      const cur = _get().plugins.find((p) => p.name === name);
      if (!cur) return;
      const next = !cur.enabled;
      // optimistic
      set((s) => ({
        plugins: s.plugins.map((p) =>
          p.name === name ? { ...p, enabled: next } : p),
        pendingActions: new Set(s.pendingActions).add(`plugin:${name}`),
      }));
      try {
        await pluginMgr.toggle(name, next);
        _get().pushToast({
          kind: 'success',
          text: next ? t('toasts.enabled', { name }) : t('toasts.disabled', { name }),
        });
      } catch (e) {
        set((s) => ({
          plugins: s.plugins.map((p) =>
            p.name === name ? { ...p, enabled: cur.enabled } : p),
          lastError: { section: 'plugins', err: e as Error },
        }));
        _get().pushToast({
          kind: 'error',
          text: t('toasts.failed_toggle', { name, err: (e as Error).message }),
        });
      } finally {
        set((s) => {
          const n = new Set(s.pendingActions);
          n.delete(`plugin:${name}`);
          return { pendingActions: n };
        });
      }
    },

    async toggleMcp(name: string) {
      const cur = _get().mcpServers.find((m) => m.name === name);
      if (!cur) return;
      const next = !cur.enabled;
      set((s) => ({
        mcpServers: s.mcpServers.map((m) => m.name === name ? { ...m, enabled: next } : m),
        pendingActions: new Set(s.pendingActions).add(`mcp:${name}`),
      }));
      try {
        await mcpMgr.toggle(name, next);
        _get().pushToast({ kind: 'success', text: next ? t('toasts.enabled', { name }) : t('toasts.disabled', { name }) });
      } catch (e) {
        set((s) => ({
          mcpServers: s.mcpServers.map((m) => m.name === name ? { ...m, enabled: cur.enabled } : m),
          lastError: { section: 'mcpServers', err: e as Error },
        }));
        _get().pushToast({ kind: 'error', text: t('toasts.failed_generic', { err: (e as Error).message }) });
      } finally {
        set((s) => {
          const n = new Set(s.pendingActions); n.delete(`mcp:${name}`);
          return { pendingActions: n };
        });
      }
    },

    async toggleSkill(id: string) {
      // NOTE: SkillDefinition uses `name` as identifier; `id` param maps to `name`
      const cur = _get().skills.find((s) => s.name === id);
      if (!cur) return;
      const curEnabled = cur.enabled ?? true;
      const next = !curEnabled;
      set((s) => ({
        skills: s.skills.map((sk) =>
          sk.name === id ? { ...sk, enabled: next } : sk),
        pendingActions: new Set(s.pendingActions).add(`skill:${id}`),
      }));
      try {
        await skillScan.toggle(cur.name, next);
        _get().pushToast({ kind: 'success', text: next ? t('toasts.enabled', { name: cur.name }) : t('toasts.disabled', { name: cur.name }) });
      } catch (e) {
        set((s) => ({
          skills: s.skills.map((sk) =>
            sk.name === id ? { ...sk, enabled: curEnabled } : sk),
          lastError: { section: 'skills', err: e as Error },
        }));
        _get().pushToast({ kind: 'error', text: t('toasts.failed_generic', { err: (e as Error).message }) });
      } finally {
        set((s) => {
          const n = new Set(s.pendingActions); n.delete(`skill:${id}`);
          return { pendingActions: n };
        });
      }
    },

    async switchProfile(name: string) {
      const prev = _get().activeProfile;
      set((s) => ({
        activeProfile: name,
        pendingActions: new Set(s.pendingActions).add(`profile:switch:${name}`),
      }));
      try {
        await profileMgr.activate(name);
        _get().pushToast({ kind: 'success', text: t('toasts.switched_profile', { name }) });
      } catch (e) {
        set({ activeProfile: prev, lastError: { section: 'profiles', err: e as Error } });
        _get().pushToast({ kind: 'error', text: t('toasts.switch_failed', { err: (e as Error).message }) });
      } finally {
        set((s) => {
          const n = new Set(s.pendingActions); n.delete(`profile:switch:${name}`);
          return { pendingActions: n };
        });
      }
    },

    async setModel(model: string) {
      const prev = _get().settings.model;
      set((s) => ({ settings: { ...s.settings, model } }));
      try {
        await configMgr.setModel(model);
        _get().pushToast({ kind: 'success', text: t('toasts.model_set', { model }) });
      } catch (e) {
        set((s) => ({ settings: { ...s.settings, model: prev }, lastError: { section: 'settings', err: e as Error } }));
        _get().pushToast({ kind: 'error', text: (e as Error).message });
      }
    },

    async setLanguage(lang: 'en' | 'zh') {
      const env = (_get().settings.env ?? {}) as Record<string, string>;
      const prev = env.CLAUDE_CONFIG_LANG;
      set((s) => ({ settings: { ...s.settings, env: { ...env, CLAUDE_CONFIG_LANG: lang } } }));
      try {
        await configMgr.setEnvVar('CLAUDE_CONFIG_LANG', lang);
        _get().pushToast({ kind: 'success', text: t('toasts.language_set', { lang }) });
      } catch (e) {
        set((s) => ({
          settings: {
            ...s.settings,
            env: { ...env, CLAUDE_CONFIG_LANG: prev ?? 'en' },
          },
          lastError: { section: 'settings', err: e as Error },
        }));
        _get().pushToast({ kind: 'error', text: (e as Error).message });
      }
    },
  }));
}
