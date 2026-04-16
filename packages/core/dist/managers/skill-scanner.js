import { join } from 'path';
import { readdir, readFile } from 'fs/promises';
import { readJsonFile, fileExists } from '../utils/file-ops.js';
import { FileNotFoundError } from '@ccm/types';
function parseFrontmatter(content) {
    const match = /^---\s*\n([\s\S]*?)\n---/.exec(content);
    if (!match)
        return {};
    const block = match[1] ?? '';
    const result = {};
    for (const line of block.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1)
            continue;
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        result[key] = value;
    }
    return {
        name: result['name'],
        description: result['description'],
    };
}
async function readDirSafe(dirPath) {
    try {
        const entries = await readdir(dirPath, { withFileTypes: true });
        return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    }
    catch {
        return [];
    }
}
export class SkillScanner {
    pluginsJsonPath;
    userSkillsPath;
    userCommandsPath;
    constructor(claudeHome) {
        this.pluginsJsonPath = join(claudeHome, 'plugins', 'installed_plugins.json');
        this.userSkillsPath = join(claudeHome, 'skills');
        this.userCommandsPath = join(claudeHome, 'commands');
    }
    async readInstalledPlugins() {
        try {
            const data = await readJsonFile(this.pluginsJsonPath);
            return data;
        }
        catch (err) {
            if (err instanceof FileNotFoundError) {
                return { version: 2, plugins: {} };
            }
            throw err;
        }
    }
    async scanPlugin(pluginPath) {
        const skillsDir = join(pluginPath, 'skills');
        const subDirs = await readDirSafe(skillsDir);
        const skills = [];
        for (const subDir of subDirs) {
            const skillFilePath = join(skillsDir, subDir, 'Skill.md');
            if (!(await fileExists(skillFilePath)))
                continue;
            try {
                const content = await readFile(skillFilePath, 'utf-8');
                const { name, description } = parseFrontmatter(content);
                skills.push({
                    name: name ?? subDir,
                    description,
                    filePath: skillFilePath,
                    content,
                    source: 'system',
                });
            }
            catch {
                // Skip unreadable files
            }
        }
        return skills;
    }
    /**
     * Scan ~/.claude/skills/ for user-created skills
     * Structure: ~/.claude/skills/<name>/Skill.md
     */
    async scanUserSkills() {
        const subDirs = await readDirSafe(this.userSkillsPath);
        const skills = [];
        for (const subDir of subDirs) {
            const skillFilePath = join(this.userSkillsPath, subDir, 'Skill.md');
            if (!(await fileExists(skillFilePath)))
                continue;
            try {
                const content = await readFile(skillFilePath, 'utf-8');
                const { name, description } = parseFrontmatter(content);
                skills.push({
                    name: name ?? subDir,
                    description,
                    filePath: skillFilePath,
                    content,
                    pluginName: 'user',
                    source: 'user',
                });
            }
            catch {
                // Skip unreadable files
            }
        }
        return skills;
    }
    async scan() {
        const { plugins } = await this.readInstalledPlugins();
        const allSkills = [];
        // 1. User skills from ~/.claude/skills/
        const userSkills = await this.scanUserSkills();
        allSkills.push(...userSkills);
        // 2. Plugin skills (system)
        for (const [pluginName, installs] of Object.entries(plugins)) {
            const install = installs[0];
            if (!install)
                continue;
            const skills = await this.scanPlugin(install.installPath);
            for (const skill of skills) {
                allSkills.push({ ...skill, pluginName, source: 'system' });
            }
        }
        return allSkills;
    }
    async getSkillContent(skillPath) {
        try {
            return await readFile(skillPath, 'utf-8');
        }
        catch (err) {
            if (err instanceof Error &&
                'code' in err &&
                err.code === 'ENOENT') {
                throw new FileNotFoundError(skillPath);
            }
            throw err;
        }
    }
    /**
     * Scan commands from both user (~/.claude/commands/) and plugin dirs.
     * User commands: ~/.claude/commands/<name>/Skill.md or ~/.claude/commands/<name>.md
     * Plugin commands: <plugin>/commands/<name>/Skill.md
     */
    async scanCommands() {
        const commands = [];
        // 1. User commands from ~/.claude/commands/
        const userCommands = await this.scanCommandsDir(this.userCommandsPath, 'user');
        commands.push(...userCommands);
        // 2. Plugin commands (system)
        const { plugins } = await this.readInstalledPlugins();
        for (const [_pluginName, installs] of Object.entries(plugins)) {
            const install = installs[0];
            if (!install)
                continue;
            const commandsDir = join(install.installPath, 'commands');
            const pluginCommands = await this.scanCommandsDir(commandsDir, 'system');
            commands.push(...pluginCommands);
        }
        return commands;
    }
    async scanCommandsDir(dirPath, source) {
        const commands = [];
        // Check for subdirectories with Skill.md
        const subDirs = await readDirSafe(dirPath);
        for (const subDir of subDirs) {
            const skillFilePath = join(dirPath, subDir, 'Skill.md');
            if (await fileExists(skillFilePath)) {
                try {
                    const content = await readFile(skillFilePath, 'utf-8');
                    const { name, description } = parseFrontmatter(content);
                    commands.push({
                        name: name ?? subDir,
                        description,
                        filePath: skillFilePath,
                        content,
                        source,
                    });
                }
                catch {
                    // skip
                }
                continue;
            }
            // Also check for direct .md files in subdirs
            const mdPath = join(dirPath, subDir + '.md');
            if (await fileExists(mdPath)) {
                try {
                    const content = await readFile(mdPath, 'utf-8');
                    const { name, description } = parseFrontmatter(content);
                    commands.push({
                        name: name ?? subDir,
                        description,
                        filePath: mdPath,
                        content,
                        source,
                    });
                }
                catch {
                    // skip
                }
            }
        }
        return commands;
    }
}
//# sourceMappingURL=skill-scanner.js.map