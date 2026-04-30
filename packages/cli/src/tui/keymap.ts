export interface KeyHint { key: string; label: string }

export const GLOBAL_HINTS: KeyHint[] = [
  { key: 'j/k',    label: 'nav' },
  { key: 'Enter',  label: 'open' },
  { key: 'Tab',    label: 'focus' },
  { key: '/',      label: 'filter' },
  { key: 'r',      label: 'refresh' },
  { key: '?',      label: 'help' },
  { key: 'q',      label: 'quit' },
];

export type PageKeymap = KeyHint[];
