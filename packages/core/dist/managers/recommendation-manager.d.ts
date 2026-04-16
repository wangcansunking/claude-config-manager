export interface Recommendation {
    name: string;
    type: 'plugin' | 'mcp' | 'skill';
    description: string;
    reason: string;
    popularity: string;
    installCommand?: string;
    url?: string;
    category?: string;
}
export interface RecommendationResult {
    recommendations: Recommendation[];
    generatedAt: string;
    model: string;
}
export declare class RecommendationManager {
    private claudeHome;
    private cacheDir;
    private cacheFile;
    constructor(claudeHome: string);
    /** Get cached recommendations (if fresh enough, < 24 hours) */
    getCached(): Promise<RecommendationResult | null>;
    /** Save recommendations to cache */
    saveCache(result: RecommendationResult): Promise<void>;
    /** Get current user context for personalized recommendations */
    getUserContext(): Promise<string>;
    /** Build the prompt for Claude to generate recommendations */
    buildPrompt(userContext: string, trendingData: string): string;
}
//# sourceMappingURL=recommendation-manager.d.ts.map