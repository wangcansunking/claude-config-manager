import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { initI18n } from '../../tui/i18n.js';

// Mock @ccm/core managers with inline vi.fn() inside the factory.
// App.tsx calls createStore() at module level, so the mock classes are
// instantiated at import time — we cannot reference module-scope variables
// defined outside the factory (TDZ in hoisted ESM mocks).
vi.mock('@ccm/core', () => ({
  PluginManager:   class { list = vi.fn().mockResolvedValue([]); toggle = vi.fn(); },
  McpManager:      class { list = vi.fn().mockResolvedValue([]); toggle = vi.fn(); },
  SkillScanner:    class { scan = vi.fn().mockResolvedValue([]); scanCommands = vi.fn().mockResolvedValue([]); },
  ConfigManager:   class { getSettings = vi.fn().mockResolvedValue({ model: 'opus', env: {} }); setModel = vi.fn(); },
  ProfileManager:  class { list = vi.fn().mockResolvedValue([]); activate = vi.fn(); getActive = vi.fn().mockResolvedValue('default'); },
  SessionManager:  class { listAllSessions = vi.fn().mockResolvedValue([]); },
  getClaudeHome:   () => '/tmp/fake-home',
  locales:         { en: {}, zh: {} },
}));

import { App } from '../../tui/App.js';

describe('<App/> rendering', () => {
  beforeEach(() => {
    initI18n('en');
  });

  it('renders only ONE sidebar (no doubled tree on initial render)', () => {
    const { lastFrame } = render(<App />);
    const frame = lastFrame()!;
    // Sidebar borders look like ┌──────────────┐ — should appear at most twice
    // (1 sidebar border + 1 main pane border = 2 max)
    const topBorderCount = (frame.match(/┌─{2,}┐/g) ?? []).length;
    expect(topBorderCount).toBeLessThanOrEqual(2);
  });

  it('does not render duplicate sidebar nav items on initial render', () => {
    const { lastFrame } = render(<App />);
    const frame = lastFrame()!;
    // In English mode, "Overview" should appear exactly once in the sidebar nav
    const overviewMatches = (frame.match(/Overview/g) ?? []).length;
    // Allow for it appearing in the page content too, but not tripled (which would indicate 2 sidebars)
    expect(overviewMatches).toBeLessThanOrEqual(2);
  });
});
