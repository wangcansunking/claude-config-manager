import { Box, Text } from 'ink';
import { tildify } from '../util/path.js';
import type { StoreState } from '../store.js';
import { t } from '../i18n.js';

export function Overview({ state }: { state: StoreState }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>{t('overview.active_profile')} </Text>
      <Text>{state.activeProfile ?? t('common.none')}</Text>

      <Box marginTop={1} flexDirection="column">
        <Text>{t('overview.plugins_count', { n: state.plugins.length })}</Text>
        <Text>{t('overview.mcps_count', { n: state.mcpServers.length })}</Text>
        <Text>{t('overview.skills_count', { n: state.skills.length })}</Text>
        <Text>{t('overview.commands_count', { n: state.commands.length })}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>{t('overview.recent_sessions')}</Text>
        {state.sessions.slice(0, 3).map((s, i) => (
          <Text key={i} dimColor>· {tildify(s.projectDir ?? s.name ?? '—')}</Text>
        ))}
        {state.sessions.length === 0 && <Text dimColor>{t('common.none')}</Text>}
      </Box>

      <Box marginTop={1}>
        <Text>{t('overview.dashboard')} </Text>
        {state.dashboardStatus.running
          ? <Text color="green">{t('overview.running')}</Text>
          : <Text color="gray">{t('overview.stopped')}</Text>}
      </Box>
    </Box>
  );
}
