import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { List } from '../../../tui/components/List.js';

const items = [
  { id: '1', label: 'apple' },
  { id: '2', label: 'banana' },
  { id: '3', label: 'cherry' },
];

describe('<List/>', () => {
  it('marks first item selected by default', () => {
    const { lastFrame } = render(
      <List items={items} renderItem={(i, sel) => `${sel?'▶':' '} ${i.label}`} onSelect={() => {}} />
    );
    expect(lastFrame()).toContain('▶ apple');
    expect(lastFrame()).toContain('  banana');
  });

  it('arrow / j moves selection', () => {
    const { lastFrame, stdin } = render(
      <List items={items} renderItem={(i, sel) => `${sel?'▶':' '} ${i.label}`} onSelect={() => {}} />
    );
    stdin.write('j');
    expect(lastFrame()).toContain('▶ banana');
  });

  it('/ enables filter and narrows results', () => {
    const { lastFrame, stdin } = render(
      <List items={items} renderItem={(i, sel) => `${sel?'▶':' '} ${i.label}`}
            filterKey={(i) => i.label} onSelect={() => {}} />
    );
    stdin.write('/');
    stdin.write('cher');
    expect(lastFrame()).toContain('cherry');
    expect(lastFrame()).not.toContain('apple');
  });

  it('Enter triggers onSelect with current item', () => {
    const onSelect = vi.fn();
    const { stdin } = render(
      <List items={items} renderItem={(i) => i.label} onSelect={onSelect} />
    );
    stdin.write('\r');
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });
});
