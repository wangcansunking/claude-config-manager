import { describe, it, expect } from 'vitest';
import { scrubSecrets, findResidualSecrets, REDACTED } from '../lib/scrub.js';

describe('scrubSecrets', () => {
  it('redacts by suspicious key name at any depth', () => {
    const input = {
      name: 'dev',
      settings: {
        apiKey: 'sk-abc',
        nested: { password: 'hunter2', normal: 'ok' },
      },
    };
    const out = scrubSecrets(input) as typeof input;
    expect(out.settings.apiKey).toBe(REDACTED);
    expect(out.settings.nested.password).toBe(REDACTED);
    expect(out.settings.nested.normal).toBe('ok');
    expect(out.name).toBe('dev');
  });

  it('blanket-redacts every value inside env blocks', () => {
    const input = {
      mcpServers: {
        'some-server': {
          command: 'node',
          args: ['server.js'],
          env: {
            OPENAI_API_KEY: 'sk-abc',
            DEBUG: 'true',
            HARMLESS: 'yes',
          },
        },
      },
    };
    const out = scrubSecrets(input) as typeof input;
    const env = out.mcpServers['some-server']!.env as Record<string, string>;
    expect(env.OPENAI_API_KEY).toBe(REDACTED);
    expect(env.DEBUG).toBe(REDACTED);
    expect(env.HARMLESS).toBe(REDACTED);
    // Non-env fields untouched.
    expect(out.mcpServers['some-server']!.command).toBe('node');
  });

  it('walks arrays and objects deeply without mutating the input', () => {
    const input = {
      items: [
        { name: 'a', token: 'secret1' },
        { name: 'b', nested: [{ apiKey: 'secret2' }] },
      ],
    };
    const frozen = JSON.parse(JSON.stringify(input));
    const out = scrubSecrets(input) as typeof input;
    expect(out.items[0]!.token).toBe(REDACTED);
    expect(out.items[1]!.nested[0]!.apiKey).toBe(REDACTED);
    expect(input).toEqual(frozen);
  });

  it('leaves non-matching keys alone', () => {
    const input = { name: 'dev', description: 'my setup', count: 3 };
    const out = scrubSecrets(input);
    expect(out).toEqual(input);
  });
});

describe('findResidualSecrets', () => {
  it('flags OpenAI-style keys in string values', () => {
    const hits = findResidualSecrets({
      settings: { greeting: 'hello sk-proj-abcdefghijklmnopqrstuv-here' },
    });
    expect(hits).toHaveLength(1);
    expect(hits[0]!.path).toBe('settings.greeting');
    expect(hits[0]!.patternName).toBe('OpenAI-style API key');
  });

  it('flags GitHub PATs and Anthropic keys', () => {
    const hits = findResidualSecrets([
      'ghp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ',
      'sk-ant-api03-abcdefghijklmnopqrstuvwxyz',
    ]);
    expect(hits.map((h) => h.patternName).sort()).toEqual(
      ['Anthropic API key', 'GitHub personal access token'].sort(),
    );
  });

  it('returns nothing on clean input', () => {
    const hits = findResidualSecrets({ name: 'dev', description: 'nothing secret here' });
    expect(hits).toEqual([]);
  });
});
