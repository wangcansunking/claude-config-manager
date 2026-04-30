import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { ConfirmModal } from '../../../tui/components/ConfirmModal.js';

describe('<ConfirmModal/>', () => {
  it('renders title and body', () => {
    const { lastFrame } = render(
      <ConfirmModal
        title="Delete profile?"
        body="This cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(lastFrame()).toContain('Delete profile?');
    expect(lastFrame()).toContain('This cannot be undone.');
    expect(lastFrame()).toMatch(/Enter.*Confirm.*Esc.*Cancel/i);
  });

  it('calls onConfirm on Enter', async () => {
    const onConfirm = vi.fn();
    const { stdin } = render(
      <ConfirmModal title="t" body="b" onConfirm={onConfirm} onCancel={() => {}} />
    );
    stdin.write('\r');
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel on Esc', () => {
    const onCancel = vi.fn();
    const { stdin } = render(
      <ConfirmModal title="t" body="b" onConfirm={() => {}} onCancel={onCancel} />
    );
    stdin.write(''); // ESC
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
