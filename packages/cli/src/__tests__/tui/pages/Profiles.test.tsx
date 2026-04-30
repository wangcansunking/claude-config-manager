import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { Profiles } from '../../../tui/pages/Profiles.js';
import { initI18n } from '../../../tui/i18n.js';

beforeEach(() => {
  initI18n('en');
});

const fakeStore: any = {
  getState: () => ({
    profiles: [{ name: 'work' }, { name: 'home' }],
    activeProfile: 'work',
    pendingActions: new Set(),
    switchProfile: vi.fn(),
    openModal: vi.fn(),
  }),
  subscribe: () => () => {},
};

describe('<Profiles/>', () => {
  it('renders profile list with active marker', () => {
    const { lastFrame } = render(
      <Profiles state={fakeStore.getState()} store={fakeStore} />
    );
    expect(lastFrame()).toContain('work');
    expect(lastFrame()).toMatch(/work.*\[active\]|active.*work/);
    expect(lastFrame()).toContain('home');
  });

  it('Enter on non-active opens confirm modal', () => {
    const openModal = vi.fn();
    const switchProfile = vi.fn();
    const state = {
      ...fakeStore.getState(),
      openModal,
      switchProfile,
    };
    const testStore = {
      getState: () => state,
      subscribe: () => () => {},
    };
    const { stdin } = render(<Profiles state={state} store={testStore as any} />);
    stdin.write('j');     // move to home
    stdin.write('\r');
    expect(openModal).toHaveBeenCalled();
    expect(openModal.mock.calls[0][0].title).toMatch(/Switch.*home/i);
  });
});
