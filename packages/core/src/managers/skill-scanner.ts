import { join } from 'path';
import { readdir, readFile } from 'fs/promises';
import { readJsonFile, fileExists } from '../utils/file-ops';
import { FileNotFoundError } from '@ccm/types';
import type { SkillDefinition, CommandDefinition } from '@ccm/types';

interface RawPluginEntry {
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
}

interface InstalledPluginsJson {
  version: number;
  plugins: Record<string, RawPluginEntry[]>;
}

function parseFrontmatter(content: string): { name?: string; description?: string } {
  const match = /^---\s*\n([\s\S]*?)\n---/.exec(content);
  if (!match) return {};
  const block = match[1] ?? '';
  const result: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    result[key] = value;
  }
  return {
    name: result['name'],
    description: result['description'],
  };
}

async function readDirSafe(dirPath: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function readDirFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    return [];
  }
}

export class SkillScanner {
  private readonly pluginsJsonPath: string;
  private readonly commandsPath: string;

  constructor(claudeHome: string) {
    this.pluginsJsonPath = join(claudeHome, 'plugins', 'installed_plugins.json');
    this.commandsPath = join(claudeHome, 'commands');
  }

  private async readInstalledPlugins(): Promise<InstalledPluginsJson> {
    try {
      const data = await readJsonFile(this.pluginsJsonPath);
      return data as InstalledPluginsJson;
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        return { version: 2, plugins: {} };
      }
      throw err;
    }
  }

  async scanPlugin(pluginPath: string): Promise<SkillDefinition[]> {
    const skillsDir = join(pluginPath, 'skills');
    const subDirs = await readDirSafe(skillsDir);
    const skills: SkillDefinition[] = [];

    for (const subDir of subDirs) {
      const skillFilePath = join(skillsDir, subDir, 'Skill.md');
      if (!(await fileExists(skillFilePath))) continue;
      try {
        const content = await readFile(skillFilePath, 'utf-8');
        const { name, description } = parseFrontmatter(content);
        skills.push({
          name: name ?? subDir,
          description,
          filePath: skillFilePath,
          content,
        });
      } catch {
        // Skip unreadable files
      }
    }

    return skills;
  }

  async scan(): Promise<SkillDefinition[]> {
    const { plugins } = await this.readInstalledPlugins();
    const allSkills: SkillDefinition[] = [];

    for (const [pluginName, installs] of Object.entries(plugins)) {
      const install = installs[0];
      if (!install) continue;
      const skills = await this.scanPlugin(install.installPath);
      // Annotate with plugin name
      for (const skill of skills) {
        allSkills.push({ ...skill, pluginName });
      }
    }

    return allSkills;
  }

  async getSkillContent(skillPath: string): Promise<string> {
    try {
      return await readFile(skillPath, 'utf-8');
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        throw new FileNotFoundError(skillPath);
      }
      throw err;
    }
  }

  async scanCommands(): Promise<CommandDefinition[]> {
    const files = await readDirFiles(this.commandsPath);
    const commands: CommandDefinition[] = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const filePath = join(this.commandsPath, file);
      try {
        const content = await readFile(filePath, 'utf-8');
        const { name, description } = parseFrontmatter(content);
        const baseName = file.replace(/\.md$/, '');
        commands.push({
          name: name ?? baseName,
          description,
          filePath,
          content,
        });
      } catch {
        // Skip unreadable files
      }
    }

    return commands;
  }
}
