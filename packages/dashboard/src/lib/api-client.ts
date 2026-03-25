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

// ---- Skills -----------------------------------------------------------------

export function fetchSkills() {
  return request<unknown[]>('/skills');
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
