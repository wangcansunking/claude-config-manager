import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { Sidebar } from '../../../tui/components/Sidebar.js';

describe('<Sidebar/>', () => {
  it('marks the active item', () => {
    const { lastFrame } = render(
      <Sidebar active="profiles" focused={true} onSelect={() => {}} />
    );
    expect(lastFrame()).toMatch(/▶.*Profiles/);
  });
});
