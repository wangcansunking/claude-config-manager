import { type StoreApi, type UseBoundStore } from 'zustand';
import { SessionManager, type ProfileSummary } from '@ccm/core';
import type { PluginListEntry, McpServerEntry, SkillDefinition, CommandDefinition } from '@ccm/types';
type SettingsRecord = Record<string, unknown>;
type SessionInfo = Awaited<ReturnType<SessionManager['listAllSessions']>>[number];
export interface SessionHistoryEntry {
    role: string;
    text: string;
    timestamp: string;
}
export type Section = 'plugins' | 'mcpServers' | 'skills' | 'commands' | 'settings' | 'profiles' | 'sessions' | 'recommendations' | 'dashboardStatus';
export type PageId = 'overview' | 'profiles' | 'sessions' | 'recommended' | 'settingsPrefs' | 'config';
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
    plugins: PluginListEntry[];
    mcpServers: McpServerEntry[];
    skills: SkillDefinition[];
    commands: CommandDefinition[];
    settings: SettingsRecord;
    profiles: ProfileSummary[];
    activeProfile: string | null;
    sessions: SessionInfo[];
    recommendations: unknown[];
    dashboardStatus: DashboardStatus;
    activePage: PageId;
    configInnerTab: ConfigInnerTab;
    focused: 'sidebar' | 'main';
    pendingActions: Set<string>;
    toasts: Toast[];
    modal: ModalDescriptor | null;
    loading: Partial<Record<Section, boolean>>;
    lastError: {
        section: Section;
        err: Error;
    } | null;
    sessionHistories: Map<string, SessionHistoryEntry[]>;
    init(): Promise<void>;
    refresh(section?: Section): Promise<void>;
    loadRecommendations(): Promise<void>;
    loadSessionHistory(historyFile: string): Promise<void>;
    setPage(p: PageId): void;
    setInnerTab(t: ConfigInnerTab): void;
    setFocus(f: 'sidebar' | 'main'): void;
    pushToast(t: Omit<Toast, 'id'>): void;
    dismissToast(id: string): void;
    openModal(m: ModalDescriptor): void;
    closeModal(): void;
    togglePlugin(name: string): Promise<void>;
    toggleMcp(name: string): Promise<void>;
    toggleSkill(id: string): Promise<void>;
    switchProfile(name: string): Promise<void>;
    setModel(model: string): Promise<void>;
    setLanguage(lang: 'en' | 'zh'): Promise<void>;
}
export type CcmStore = UseBoundStore<StoreApi<StoreState>>;
export declare function createStore(): CcmStore;
export {};
//# sourceMappingURL=store.d.ts.map