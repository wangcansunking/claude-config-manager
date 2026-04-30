import { create, type StoreApi, type UseBoundStore } from 'zustand';
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

// SettingsRecord is defined locally in ConfigManager — re-alias here
type SettingsRecord = Record<string, unknown>;

// SessionInfo is the real return type from SessionManager.listAllSessions()
type SessionInfo = Awaited<ReturnType<SessionManager['listAllSessions']>>[number];

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

  // actions
  init():                                    Promise<void>;
  setPage(p: PageId):                        void;
  setInnerTab(t: ConfigInnerTab):            void;
  setFocus(f: 'sidebar' | 'main'):           void;
  pushToast(t: Omit<Toast, 'id'>):           void;
  dismissToast(id: string):                  void;
  openModal(m: ModalDescriptor):             void;
  closeModal():                              void;
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

    setPage(p)        { set({ activePage: p, focused: 'main' }); },
    setInnerTab(t)    { set({ configInnerTab: t }); },
    setFocus(f)       { set({ focused: f }); },
    pushToast(t) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    },
    dismissToast(id)  { set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })); },
    openModal(m)      { set({ modal: m }); },
    closeModal()      { set({ modal: null }); },
  }));
}
