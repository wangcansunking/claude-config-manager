export interface CommandDefinition {
    name: string;
    description?: string;
    filePath: string;
    content?: string;
    args?: string[];
    source: 'user' | 'system';
}
export interface SkillDefinition {
    name: string;
    description?: string;
    filePath: string;
    content?: string;
    tags?: string[];
    version?: string;
    pluginName?: string;
    source: 'user' | 'system';
}
//# sourceMappingURL=skill.d.ts.map