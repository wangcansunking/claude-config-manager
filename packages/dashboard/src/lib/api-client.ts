const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---- Stats ----------------------------------------------------------------

export function fetchStats() {
  return request<{
    plugins: number;
    mcpServers: number;
    skills: number;
    profiles: number;
  }>('/stats');
}

// ---- Plugins ----------------------------------------------------------------

export function fetchPlugins() {
  return request<unknown[]>('/plugins');
}

export function installPlugin(name: string) {
  return request<unknown>('/plugins', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function removePlugin(name: string) {
  return request<void>(`/plugins/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

export function togglePlugin(name: string, enabled: boolean) {
  return request<unknown>(`/plugins/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

// ---- MCP Servers ------------------------------------------------------------

export function fetchMcpServers() {
  return request<unknown[]>('/mcp-servers');
}

export function addMcpServer(name: string, config: unknown) {
  return request<unknown>('/mcp-servers', {
    method: 'POST',
    body: JSON.stringify({ name, config }),
  });
}

export function removeMcpServer(name: string) {
  return request<void>(`/mcp-servers/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

// ---- Settings ---------------------------------------------------------------

export function fetchSettings() {
  return request<Record<string, unknown>>('/settings');
}

export function updateSettings(patch: Record<string, unknown>) {
  return request<void>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function fetchEnvVars() {
  return request<Record<string, string>>('/settings/env');
}

export function setEnvVar(key: string, value: string) {
  return request<void>('/settings/env', {
    method: 'PUT',
    body: JSON.stringify({ key, value }),
  });
}

export function removeEnvVar(key: string) {
  return request<void>(`/settings/env/${encodeURIComponent(key)}`, { method: 'DELETE' });
}

// ---- Sessions ---------------------------------------------------------------

export function fetchSessions() {
  return request<unknown[]>('/sessions');
}

export function fetchSessionHistory(historyFile: string, limit?: number) {
  const params = new URLSearchParams({ file: historyFile });
  if (limit) params.set('limit', String(limit));
  return request<{ role: string; text: string; timestamp: string }[]>(
    `/sessions/history?${params.toString()}`,
  );
}

// ---- Skills -----------------------------------------------------------------

export function fetchSkills() {
  return request<unknown[]>('/skills');
}

export async function updateSkillContent(filePath: string, content: string) {
  const res = await fetch('/api/skills/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, content }),
  });
  if (!res.ok) throw new Error('Failed to save');
  return res.json();
}

// ---- MCP Registry -----------------------------------------------------------

export async function searchMcpRegistry(query: string) {
  const res = await fetch(`/api/mcp-registry?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json() as Promise<{
    results: {
      name: string;
      description: string;
      source: 'mcp-registry' | 'npm' | 'smithery';
      version?: string;
      installCommand?: string;
      repositoryUrl?: string;
      npmUrl?: string;
      score?: number;
    }[];
    smitheryAvailable: boolean;
  }>;
}

export async function installMcpFromRegistry(
  name: string,
  command: string,
  args: string[],
  env?: Record<string, string>,
) {
  const res = await fetch('/api/mcp-registry/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, command, args, env }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Install failed' }));
    throw new Error(data.error ?? 'Install failed');
  }
  return res.json();
}

// ---- Commands ---------------------------------------------------------------

export function fetchCommands() {
  return request<unknown[]>('/commands');
}

// ---- Profiles ---------------------------------------------------------------

export function fetchProfiles() {
  return request<unknown[]>('/profiles');
}

export function createProfile(name: string) {
  return request<unknown>('/profiles', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateProfile(name: string, patch: Record<string, unknown>) {
  return request<unknown>(`/profiles/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function activateProfile(name: string) {
  return request<void>(`/profiles/${encodeURIComponent(name)}/activate`, { method: 'POST' });
}

export function deleteProfile(name: string) {
  return request<void>(`/profiles/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

export function exportProfile(name: string) {
  return request<string>('/export', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function importProfile(data: string, strategy: 'merge' | 'replace' = 'replace') {
  return request<unknown>('/import', {
    method: 'POST',
    body: JSON.stringify({ data, strategy }),
  });
}

// ---- Metrics ----------------------------------------------------------------

export function fetchMetrics() {
  return request<{
    skills: { name: string; usageCount: number; lastUsedAt: number; category: string; mcpServer?: string }[];
    builtinTools: { name: string; usageCount: number; lastUsedAt: number; category: string }[];
    mcpTools: { name: string; usageCount: number; lastUsedAt: number; category: string; mcpServer?: string }[];
    totalToolCalls: number;
    totalSkillCalls: number;
    topTools: { name: string; usageCount: number; lastUsedAt: number; category: string; mcpServer?: string }[];
    topSkills: { name: string; usageCount: number; lastUsedAt: number; category: string }[];
    mcpServerBreakdown: { server: string; toolCount: number; totalCalls: number }[];
  }>('/metrics');
}

// ---- Marketplaces -----------------------------------------------------------

export function fetchMarketplaces() {
  return request<{ name: string; source: { source: string; repo: string }; installLocation: string; lastUpdated: string }[]>(
    '/marketplaces',
  );
}

export function addMarketplace(name: string, repo: string) {
  return request<{ success: boolean }>('/marketplaces', {
    method: 'POST',
    body: JSON.stringify({ name, repo }),
  });
}

export function removeMarketplace(name: string) {
  return request<{ success: boolean }>(`/marketplaces/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}

export function fetchAvailablePlugins(marketplace: string) {
  return request<{
    name: string;
    description: string;
    version: string;
    installed: boolean;
    enabled: boolean;
    marketplace: string;
    category?: string;
    homepage?: string;
  }[]>(`/marketplaces/${encodeURIComponent(marketplace)}/plugins`);
}

// ---- Recommendations --------------------------------------------------------

export interface Recommendation {
  name: string;
  type: 'plugin' | 'mcp' | 'skill';
  description: string;
  reason: string;
  popularity: string;
  installCommand?: string;
  url?: string;
  category?: string;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  generatedAt: string | null;
  model: string | null;
}

export function fetchRecommendations() {
  return request<RecommendationResult>('/recommendations');
}

export function generateRecommendations() {
  return request<RecommendationResult>('/recommendations', { method: 'POST' });
}
