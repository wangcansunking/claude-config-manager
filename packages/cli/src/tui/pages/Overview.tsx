import { Box, Text } from 'ink';
import type { StoreState } from '../store.js';

export function Overview({ state }: { state: StoreState }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Active profile: </Text>
      <Text>{state.activeProfile ?? '(none)'}</Text>

      <Box marginTop={1} flexDirection="column">
        <Text>Plugins: {state.plugins.length}</Text>
        <Text>MCPs: {state.mcpServers.length}</Text>
        <Text>Skills: {state.skills.length}</Text>
        <Text>Commands: {state.commands.length}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Recent sessions</Text>
        {state.sessions.slice(0, 3).map((s, i) => (
          <Text key={i} dimColor>· {s.projectDir ?? s.name ?? '—'}</Text>
        ))}
        {state.sessions.length === 0 && <Text dimColor>(none)</Text>}
      </Box>

      <Box marginTop={1}>
        <Text>Dashboard: </Text>
        {state.dashboardStatus.running
          ? <Text color="green">● running</Text>
          : <Text color="gray">○ stopped</Text>}
      </Box>
    </Box>
  );
}
