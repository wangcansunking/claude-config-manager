import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { MarkdownPreview } from '../../../tui/components/MarkdownPreview.js';

describe('<MarkdownPreview/>', () => {
  it('renders short markdown text verbatim', () => {
    const { lastFrame } = render(<MarkdownPreview markdown="# Title\n\ntext" maxLines={5} />);
    expect(lastFrame()).toContain('Title');
    expect(lastFrame()).toContain('text');
  });

  it('truncates long content and shows hint', () => {
    const big = 'x\n'.repeat(500);
    const { lastFrame } = render(<MarkdownPreview markdown={big} maxLines={10} />);
    expect(lastFrame()).toMatch(/truncated|…/);
  });
});
