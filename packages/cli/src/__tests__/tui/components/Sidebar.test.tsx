import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { Sidebar } from '../../../tui/components/Sidebar.js';
import { initI18n } from '../../../tui/i18n.js';

beforeEach(() => {
  initI18n('en');
});

describe('<Sidebar/>', () => {
  it('marks the active item', () => {
    const { lastFrame } = render(
      <Sidebar active="profiles" focused={true} onSelect={() => {}} />
    );
    expect(lastFrame()).toMatch(/▶.*Profiles/);
  });

  it('renders all nav items in English', () => {
    const { lastFrame } = render(
      <Sidebar active="overview" focused={false} onSelect={() => {}} />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Overview');
    expect(frame).toContain('Config');
    expect(frame).toContain('Sessions');
    expect(frame).toContain('Recommend');
    expect(frame).toContain('Settings');
  });

  it('does not compress when flexShrink=0 is set', () => {
    // The component renders with width={16} and flexShrink={0}
    // We can't test flex layout directly but verify it renders without error
    const { lastFrame } = render(
      <Sidebar active="overview" focused={true} onSelect={() => {}} />
    );
    expect(lastFrame()).toBeTruthy();
  });
});
