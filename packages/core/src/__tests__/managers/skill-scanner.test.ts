import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { SkillScanner } from '../../managers/skill-scanner';
import { FileNotFoundError } from '@ccm/types';
import { readJsonFile } from '../../utils/file-ops';

const BRAINSTORMING_SKILL = `---
name: brainstorming
description: Explore user intent before implementation
---
# Brainstorming

Help the user think through their problem before writing code.
`;

const PLANNING_SKILL = `---
name: planning
description: Create a structured plan for a task
---
# Planning

Break down complex tasks into manageable steps.
`;

const NO_FRONTMATTER_SKILL = `# Simple Skill

This skill has no frontmatter.
`;

async function writeSkillFile(dir: string, content: string): Promise<void> {
  await writeFile(join(dir, 'Skill.md'), content);
}

describe('SkillScanner', () => {
  let tempDir: string;
  let scanner: SkillScanner;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'skill-scanner-test-'));
    scanner = new SkillScanner(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('scanPlugin', () => {
    it('returns an empty array when plugin has no skills directory', async () => {
      const pluginPath = join(tempDir, 'my-plugin');
      await mkdir(pluginPath, { recursive: true });
      const skills = await scanner.scanPlugin(pluginPath);
      expect(skills).toEqual([]);
    });

    it('returns an empty array when skills directory has no subdirectories', async () => {
      const pluginPath = join(tempDir, 'my-plugin');
      await mkdir(join(pluginPath, 'skills'), { recursive: true });
      const skills = await scanner.scanPlugin(pluginPath);
      expect(skills).toEqual([]);
    });

    it('reads a single skill from a plugin', async () => {
      const pluginPath = join(tempDir, 'my-plugin');
      const skillDir = join(pluginPath, 'skills', 'brainstorming');
      await mkdir(skillDir, { recursive: true });
      await writeSkillFile(skillDir, BRAINSTORMING_SKILL);
      const skills = await scanner.scanPlugin(pluginPath);
      expect(skills).toHaveLength(1);
      expect(skills[0]?.name).toBe('brainstorming');
      expect(skills[0]?.description).toBe('Explore user intent before implementation');
    });

    it('reads multiple skills from a plugin', async () => {
      const pluginPath = join(tempDir, 'my-plugin');
      await mkdir(join(pluginPath, 'skills', 'brainstorming'), { recursive: true });
      await mkdir(join(pluginPath, 'skills', 'planning'), { recursive: true });
      await writeSkillFile(join(pluginPath, 'skills', 'brainstorming'), BRAINSTORMING_SKILL);
      await writeSkillFile(join(pluginPath, 'skills', 'planning'), PLANNING_SKILL);
      const skills = await scanner.scanPlugin(pluginPath);
      expect(skills).toHaveLength(2);
      const names = skills.map((s) => s.name);
      expect(names).toContain('brainstorming');
      expect(names).toContain('planning');
    });

    it('uses subdirectory name as fallback when frontmatter has no name', async () => {
      const pluginPath = join(tempDir, 'my-plugin');
      const skillDir = join(pluginPath, 'skills', 'my-skill');
      await mkdir(skillDir, { recursive: true });
      await writeSkillFile(skillDir, NO_FRONTMATTER_SKILL);
      const skills = await scanner.scanPlugin(pluginPath);
      expect(skills).toHaveLength(1);
      expect(skills[0]?.name).toBe('my-skill');
    });

    it('skips subdirectories without Skill.md', async () => {
      const pluginPath = join(tempDir, 'my-plugin');
      await mkdir(join(pluginPath, 'skills', 'empty-skill'), { recursive: true });
      // No Skill.md written
      const skills = await scanner.scanPlugin(pluginPath);
      expect(skills).toEqual([]);
    });
  });

  describe('scan', () => {
    it('returns an empty array when no installed_plugins.json exists', async () => {
      const skills = await scanner.scan();
      expect(skills).toEqual([]);
    });

    it('scans all plugins listed in installed_plugins.json', async () => {
      const plugin1Path = join(tempDir, 'plugin1');
      const plugin2Path = join(tempDir, 'plugin2');
      await mkdir(join(plugin1Path, 'skills', 'brainstorming'), { recursive: true });
      await mkdir(join(plugin2Path, 'skills', 'planning'), { recursive: true });
      await writeSkillFile(join(plugin1Path, 'skills', 'brainstorming'), BRAINSTORMING_SKILL);
      await writeSkillFile(join(plugin2Path, 'skills', 'planning'), PLANNING_SKILL);

      await mkdir(join(tempDir, 'plugins'), { recursive: true });
      await writeFile(
        join(tempDir, 'plugins', 'installed_plugins.json'),
        JSON.stringify({
          version: 2,
          plugins: {
            'superpowers@official': [
              {
                installPath: plugin1Path,
                version: '1.0.0',
                installedAt: '2026-01-01T00:00:00Z',
                lastUpdated: '2026-01-01T00:00:00Z',
              },
            ],
            'devtools@official': [
              {
                installPath: plugin2Path,
                version: '2.0.0',
                installedAt: '2026-01-01T00:00:00Z',
                lastUpdated: '2026-01-01T00:00:00Z',
              },
            ],
          },
        }),
      );

      const skills = await scanner.scan();
      expect(skills).toHaveLength(2);
      const brainstorming = skills.find((s) => s.name === 'brainstorming');
      expect(brainstorming).toBeDefined();
      expect((brainstorming as Record<string, unknown>)?.pluginName).toBe('superpowers@official');
    });
  });

  describe('getSkillContent', () => {
    it('reads the content of a skill file', async () => {
      const skillDir = join(tempDir, 'my-skill');
      await mkdir(skillDir, { recursive: true });
      const skillPath = join(skillDir, 'Skill.md');
      await writeFile(skillPath, BRAINSTORMING_SKILL);
      const content = await scanner.getSkillContent(skillPath);
      expect(content).toBe(BRAINSTORMING_SKILL);
    });

    it('throws FileNotFoundError when skill file does not exist', async () => {
      await expect(
        scanner.getSkillContent(join(tempDir, 'nonexistent', 'Skill.md')),
      ).rejects.toThrow(FileNotFoundError);
    });
  });

  describe('scanCommands', () => {
    it('returns an empty array when commands directory does not exist', async () => {
      const commands = await scanner.scanCommands();
      expect(commands).toEqual([]);
    });

    it('reads Skill.md from command subdirectories', async () => {
      const commandsDir = join(tempDir, 'commands');
      const cmdDir = join(commandsDir, 'my-command');
      await mkdir(cmdDir, { recursive: true });
      await writeFile(
        join(cmdDir, 'Skill.md'),
        '---\nname: my-command\ndescription: A custom command\n---\n# My Command\n',
      );
      const commands = await scanner.scanCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0]?.name).toBe('my-command');
      expect(commands[0]?.description).toBe('A custom command');
      expect(commands[0]?.source).toBe('user');
    });
  });

  describe('toggle', () => {
    async function writeInstalledPlugins(plugin1Path: string): Promise<void> {
      await mkdir(join(tempDir, 'plugins'), { recursive: true });
      await writeFile(
        join(tempDir, 'plugins', 'installed_plugins.json'),
        JSON.stringify({
          version: 2,
          plugins: {
            'superpowers@official': [
              {
                installPath: plugin1Path,
                version: '1.0.0',
                installedAt: '2026-01-01T00:00:00Z',
                lastUpdated: '2026-01-01T00:00:00Z',
              },
            ],
          },
        }),
      );
    }

    it('writes enabledSkills[name] = false in settings.json', async () => {
      await scanner.toggle('brainstorming', false);
      const settings = await readJsonFile(join(tempDir, 'settings.json'));
      expect(settings).toMatchObject({ enabledSkills: { brainstorming: false } });
    });

    it('writes enabledSkills[name] = true in settings.json', async () => {
      await scanner.toggle('planning', true);
      const settings = await readJsonFile(join(tempDir, 'settings.json'));
      expect(settings).toMatchObject({ enabledSkills: { planning: true } });
    });

    it('scan() reflects the disabled state', async () => {
      const pluginPath = join(tempDir, 'my-plugin');
      await mkdir(join(pluginPath, 'skills', 'brainstorming'), { recursive: true });
      await writeSkillFile(join(pluginPath, 'skills', 'brainstorming'), BRAINSTORMING_SKILL);
      await writeInstalledPlugins(pluginPath);

      await scanner.toggle('brainstorming', false);
      const skills = await scanner.scan();
      const skill = skills.find((s) => s.name === 'brainstorming');
      expect(skill?.enabled).toBe(false);
    });

    it('re-enabling a skill writes enabled=true to settings.json', async () => {
      // Disable then re-enable — settings should reflect the latest state
      await scanner.toggle('brainstorming', false);
      await scanner.toggle('brainstorming', true);
      const settings = await readJsonFile(join(tempDir, 'settings.json'));
      expect(settings).toMatchObject({ enabledSkills: { brainstorming: true } });
    });

    it('preserves existing settings when toggling', async () => {
      await writeFile(
        join(tempDir, 'settings.json'),
        JSON.stringify({ model: 'claude-opus-4-5' }),
      );
      await scanner.toggle('brainstorming', false);
      const settings = await readJsonFile(join(tempDir, 'settings.json'));
      expect(settings).toMatchObject({
        model: 'claude-opus-4-5',
        enabledSkills: { brainstorming: false },
      });
    });
  });
});
