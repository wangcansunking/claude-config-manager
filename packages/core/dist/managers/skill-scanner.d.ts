import type { SkillDefinition, CommandDefinition } from '@ccm/types';
export declare class SkillScanner {
    private readonly pluginsJsonPath;
    private readonly userSkillsPath;
    private readonly userCommandsPath;
    private readonly settingsPath;
    constructor(claudeHome: string);
    private readEnabledMap;
    /**
     * Toggle a skill's enabled state by name.
     * NOTE: For v1, skill name is used as the key. In the rare case that skills from
     * different plugins share the same name, they will share the same toggle state
     * (matches the pattern of PluginManager.toggle using plugin names as keys).
     */
    toggle(name: string, enabled: boolean): Promise<void>;
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