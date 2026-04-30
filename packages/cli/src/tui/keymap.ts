export interface KeyHint { key: string; label: string }

export const GLOBAL_HINTS: KeyHint[] = [
  { key: '↑↓/jk',  label: 'nav' },
  { key: 'Enter',  label: 'enter' },
  { key: 'Esc',    label: 'back' },
  { key: 'Tab',    label: 'switch focus' },
  { key: '/',      label: 'filter' },
  { key: '?',      label: 'help' },
  { key: 'q',      label: 'quit' },
];

export type PageKeymap = KeyHint[];
