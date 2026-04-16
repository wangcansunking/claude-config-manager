import { Command } from 'commander';
import type { PluginListEntry, McpServerEntry, SkillDefinition, CommandDefinition } from '@ccm/types';
export interface ListOptions {
    plugins?: boolean;
    mcps?: boolean;
    skills?: boolean;
    commands?: boolean;
    json?: boolean;
}
export interface ListResult {
    plugins?: PluginListEntry[];
    mcps?: McpServerEntry[];
    skills?: SkillDefinition[];
    commands?: CommandDefinition[];
}
export declare function runList(options: ListOptions, claudeHome?: string): Promise<ListResult>;
export declare function makeListCommand(): Command;
//# sourceMappingURL=list.d.ts.map