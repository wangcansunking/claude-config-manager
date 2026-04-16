import type { SkillDefinition, CommandDefinition } from '@ccm/types';
export declare class SkillScanner {
    private readonly pluginsJsonPath;
    private readonly userSkillsPath;
    private readonly userCommandsPath;
    constructor(claudeHome: string);
    private readInstalledPlugins;
    scanPlugin(pluginPath: string): Promise<SkillDefinition[]>;
    /**
     * Scan ~/.claude/skills/ for user-created skills
     * Structure: ~/.claude/skills/<name>/Skill.md
     */
    private scanUserSkills;
    scan(): Promise<SkillDefinition[]>;
    getSkillContent(skillPath: string): Promise<string>;
    /**
     * Scan commands from both user (~/.claude/commands/) and plugin dirs.
     * User commands: ~/.claude/commands/<name>/Skill.md or ~/.claude/commands/<name>.md
     * Plugin commands: <plugin>/commands/<name>/Skill.md
     */
    scanCommands(): Promise<CommandDefinition[]>;
    private scanCommandsDir;
}
//# sourceMappingURL=skill-scanner.d.ts.map