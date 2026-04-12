import useSWR from 'swr';
import { fetchStats, fetchPlugins, fetchMcpServers, fetchSkills, fetchCommands, fetchProfiles, fetchSettings, fetchSessions, fetchSessionHistory, fetchMarketplaces, fetchAvailablePlugins } from './api-client';

const swrConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 5000, // don't refetch within 5s
};

export function useStats() {
  return useSWR('stats', fetchStats, swrConfig);
}

export function usePlugins() {
  return useSWR('plugins', fetchPlugins, swrConfig);
}

export function useMcpServers() {
  return useSWR('mcp-servers', fetchMcpServers, swrConfig);
}

export function useSkills() {
  return useSWR('skills', fetchSkills, swrConfig);
}

export function useCommands() {
  return useSWR('commands', fetchCommands, swrConfig);
}

export function useProfiles() {
  return useSWR('profiles', fetchProfiles, swrConfig);
}

export function useSettings() {
  return useSWR('settings', fetchSettings, swrConfig);
}

export function useSessions() {
  return useSWR('sessions', fetchSessions, swrConfig);
}

export function useSessionHistory(historyFile: string | null) {
  return useSWR(
    historyFile ? ['session-history', historyFile] : null,
    () => (historyFile ? fetchSessionHistory(historyFile) : Promise.resolve([])),
    swrConfig,
  );
}

export function useMarketplaces() {
  return useSWR('marketplaces', fetchMarketplaces, swrConfig);
}

export function useAvailablePlugins(marketplace: string | null) {
  return useSWR(
    marketplace ? ['available-plugins', marketplace] : null,
    () => (marketplace ? fetchAvailablePlugins(marketplace) : Promise.resolve([])),
    swrConfig,
  );
}
