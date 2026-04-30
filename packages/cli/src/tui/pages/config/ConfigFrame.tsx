import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import type { CcmStore, ConfigInnerTab, StoreState } from '../../store.js';
import { Plugins } from './Plugins.js';
import { McpServers } from './McpServers.js';
import { Skills } from './Skills.js';
import { Commands } from './Commands.js';
import { Settings } from './Settings.js';

const TABS: Array<{ id: ConfigInnerTab; label: string; key: string }> = [
  { id: 'plugins',  label: 'plugins',  key: 'p' },
  { id: 'mcps',     label: 'MCPs',     key: 'm' },
  { id: 'skills',   label: 'skills',   key: 's' },
  { id: 'commands', label: 'commands', key: 'c' },
  { id: 'settings', label: 'settings', key: 'g' },
];

export function ConfigFrame({ state, store }: { state: StoreState; store: CcmStore }) {
  const { stdin } = useStdin();

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();

      // Letter keys p/m/s/c/g: jump to tab
      const t = TABS.find((x) => x.key === str);
      if (t) {
        store.getState().setInnerTab(t.id);
        return;
      }

      // h: previous tab
      if (str === 'h') {
        const idx = TABS.findIndex((x) => x.id === state.configInnerTab);
        store.getState().setInnerTab(TABS[Math.max(idx - 1, 0)].id);
        return;
      }

      // l: next tab
      if (str === 'l') {
        const idx = TABS.findIndex((x) => x.id === state.configInnerTab);
        store.getState().setInnerTab(TABS[Math.min(idx + 1, TABS.length - 1)].id);
        return;
      }
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, state.configInnerTab, store]);

  let content: React.ReactNode = null;
  switch (state.configInnerTab) {
    case 'plugins':  content = <Plugins  state={state} store={store} />; break;
    case 'mcps':     content = <McpServers state={state} store={store} />; break;
    case 'skills':   content = <Skills   state={state} store={store} />; break;
    case 'commands': content = <Commands state={state} store={store} />; break;
    case 'settings': content = <Settings state={state} store={store} />; break;
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        {TABS.map((t, i) => (
          <Text key={t.id} bold={t.id === state.configInnerTab}>
            {i > 0 ? ' | ' : ''}
            <Text color={t.id === state.configInnerTab ? 'cyan' : undefined}>
              {`[${t.key}] ${t.label}`}
            </Text>
          </Text>
        ))}
      </Box>
      <Box marginTop={1} flexDirection="column" flexGrow={1}>{content}</Box>
    </Box>
  );
}
