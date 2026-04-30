import { Box, Text } from 'ink';
import type { DashboardStatus } from '../store.js';

export function Header({
  version, language, dashboard,
}: { version: string; language: string; dashboard: DashboardStatus }) {
  const dot   = dashboard.running ? '●' : '○';
  const color = dashboard.running ? 'green' : 'gray';
  return (
    <Box paddingX={1}>
      <Text bold>ccm </Text>
      <Text dimColor>{version} · </Text>
      <Text>{language} · </Text>
      <Text>dashboard </Text>
      <Text color={color}>{dot}</Text>
      <Text dimColor>  ({dashboard.running ? 'running' : 'stopped'})</Text>
    </Box>
  );
}
