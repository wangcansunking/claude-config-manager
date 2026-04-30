import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Recommended } from '../../../tui/pages/Recommended.js';

vi.mock('../../../tui/util/clipboard.js', () => ({
  copyToClipboard: vi.fn().mockResolvedValue({ ok: true, via: 'pbcopy' }),
}));

const state: any = {
  recommendations: [
    { name: 'foo', type: 'mcp',    description: 'A',
      installCommand: 'npx -y foo', popularity: 'Top'      },
    { name: 'bar', type: 'plugin', description: 'B',
      installCommand: '/plugin install bar@x', popularity: 'Trending' },
    { name: 'baz', type: 'skill',  description: 'C',
      installCommand: 'npx skills add owner/repo@baz', popularity: 'Top' },
  ],
};

describe('<Recommended/>', () => {
  it('groups by type', () => {
    const store = { getState: () => ({ pushToast: vi.fn(), loadRecommendations: vi.fn() }) };
    const { lastFrame } = render(<Recommended state={state} store={store as any} />);
    expect(lastFrame()).toMatch(/MCP/);
    expect(lastFrame()).toMatch(/PLUGIN/);
    expect(lastFrame()).toMatch(/SKILL/);
    expect(lastFrame()).toContain('foo');
    expect(lastFrame()).toContain('bar');
    expect(lastFrame()).toContain('baz');
  });

  it('shows EmptyState when array is empty', () => {
    const empty = { ...state, recommendations: [] };
    const store = { getState: () => ({ pushToast: vi.fn(), loadRecommendations: vi.fn() }) };
    const { lastFrame } = render(<Recommended state={empty} store={store as any} />);
    expect(lastFrame()).toMatch(/ccm-recommendations/);
  });
});
