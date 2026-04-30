import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { Toast } from '../../../tui/components/Toast.js';

describe('<Toast/>', () => {
  it('renders text with kind-appropriate prefix', () => {
    const { lastFrame } = render(
      <Toast id="x" kind="success" text="Saved" />
    );
    expect(lastFrame()).toMatch(/✓.*Saved/);
  });

  it('renders error with red prefix', () => {
    const { lastFrame } = render(
      <Toast id="x" kind="error" text="Boom" />
    );
    expect(lastFrame()).toMatch(/✗.*Boom/);
  });
});
