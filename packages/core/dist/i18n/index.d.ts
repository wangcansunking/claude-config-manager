import en from './locales/en.json';
export type SupportedLanguage = 'en' | 'zh';
export declare const supportedLanguages: SupportedLanguage[];
export declare const locales: {
    readonly en: {
        nav: {
            dashboard: string;
            recommended: string;
            configuration: string;
            profiles: string;
            activity: string;
        };
        theme: {
            auto: string;
            dark: string;
            light: string;
        };
        language: {
            label: string;
            en: string;
            zh: string;
        };
        overview: {
            title: string;
            plugins: string;
            mcpServers: string;
            skills: string;
            profiles: string;
            sessions: string;
            topSkills: string;
            topTools: string;
            recentSessions: string;
            environmentHealth: string;
            viewAll: string;
            noData: string;
            hooksNone: string;
            active: string;
            configured: string;
            envSet: string;
        };
        recommended: {
            title: string;
            subtitle: string;
            emptyTitle: string;
            emptyBody: string;
            generate: string;
            generating: string;
            refresh: string;
            lastUpdated: string;
            install: string;
            dismiss: string;
            why: string;
            filterAll: string;
            filterPlugins: string;
            filterMcps: string;
            filterSkills: string;
            findMore: string;
            findMoreBody: string;
            findMorePlaceholder: string;
            findMoreEmpty: string;
        };
        config: {
            tabs: {
                plugins: string;
                mcp: string;
                skills: string;
                commands: string;
                settings: string;
            };
            saveToProfile: string;
            saveDialog: {
                title: string;
                body: string;
                profileName: string;
                descriptionLabel: string;
                namePlaceholder: string;
                descriptionPlaceholder: string;
                nameRequired: string;
                saveFailed: string;
                profileSaved: string;
                clickToView: string;
            };
            plugins: {
                title: string;
                installed: string;
                marketplace: string;
                manageMarketplaces: string;
                searchInstalledPlaceholder: string;
                searchAvailablePlaceholder: string;
                marketplaceSelectPlaceholder: string;
                enabled: string;
                disabled: string;
                copyCommand: string;
                installNotice: string;
                marketplaceStaleNotice: string;
            };
            mcp: {
                title: string;
                installed: string;
                store: string;
                searchInstalledPlaceholder: string;
                searchStorePlaceholder: string;
                install: string;
                installCopyNotice: string;
                noResults: string;
            };
            skills: {
                title: string;
                searchPlaceholder: string;
                installed: string;
                store: string;
                top: string;
                edit: string;
                preview: string;
                noResults: string;
            };
            commands: {
                title: string;
                searchPlaceholder: string;
                noResults: string;
            };
            settings: {
                title: string;
                model: string;
                modelHelp: string;
                modelSelectPlaceholder: string;
                modelCustomPlaceholder: string;
                hooks: string;
                envVars: string;
                envKeyPlaceholder: string;
                envValuePlaceholder: string;
                envAdd: string;
                envShow: string;
                envHide: string;
                envRemove: string;
                noEnv: string;
            };
        };
        profiles: {
            title: string;
            tabs: {
                profiles: string;
                exportImport: string;
            };
            emptyTitle: string;
            emptyBody: string;
            saveCurrent: string;
        };
        activity: {
            title: string;
            subtitle: string;
            recent: string;
            allSessions: string;
            searchPlaceholder: string;
            running: string;
            resume: string;
        };
        common: {
            close: string;
            cancel: string;
            save: string;
            saving: string;
            delete: string;
            confirm: string;
            copy: string;
            copied: string;
            loading: string;
            search: string;
        };
    };
    readonly zh: {
        nav: {
            dashboard: string;
            recommended: string;
            configuration: string;
            profiles: string;
            activity: string;
        };
        theme: {
            auto: string;
            dark: string;
            light: string;
        };
        language: {
            label: string;
            en: string;
            zh: string;
        };
        overview: {
            title: string;
            plugins: string;
            mcpServers: string;
            skills: string;
            profiles: string;
            sessions: string;
            topSkills: string;
            topTools: string;
            recentSessions: string;
            environmentHealth: string;
            viewAll: string;
            noData: string;
            hooksNone: string;
            active: string;
            configured: string;
            envSet: string;
        };
        recommended: {
            title: string;
            subtitle: string;
            emptyTitle: string;
            emptyBody: string;
            generate: string;
            generating: string;
            refresh: string;
            lastUpdated: string;
            install: string;
            dismiss: string;
            why: string;
            filterAll: string;
            filterPlugins: string;
            filterMcps: string;
            filterSkills: string;
            findMore: string;
            findMoreBody: string;
            findMorePlaceholder: string;
            findMoreEmpty: string;
        };
        config: {
            tabs: {
                plugins: string;
                mcp: string;
                skills: string;
                commands: string;
                settings: string;
            };
            saveToProfile: string;
            saveDialog: {
                title: string;
                body: string;
                profileName: string;
                descriptionLabel: string;
                namePlaceholder: string;
                descriptionPlaceholder: string;
                nameRequired: string;
                saveFailed: string;
                profileSaved: string;
                clickToView: string;
            };
            plugins: {
                title: string;
                installed: string;
                marketplace: string;
                manageMarketplaces: string;
                searchInstalledPlaceholder: string;
                searchAvailablePlaceholder: string;
                marketplaceSelectPlaceholder: string;
                enabled: string;
                disabled: string;
                copyCommand: string;
                installNotice: string;
                marketplaceStaleNotice: string;
            };
            mcp: {
                title: string;
                installed: string;
                store: string;
                searchInstalledPlaceholder: string;
                searchStorePlaceholder: string;
                install: string;
                installCopyNotice: string;
                noResults: string;
            };
            skills: {
                title: string;
                searchPlaceholder: string;
                installed: string;
                store: string;
                top: string;
                edit: string;
                preview: string;
                noResults: string;
            };
            commands: {
                title: string;
                searchPlaceholder: string;
                noResults: string;
            };
            settings: {
                title: string;
                model: string;
                modelHelp: string;
                modelSelectPlaceholder: string;
                modelCustomPlaceholder: string;
                hooks: string;
                envVars: string;
                envKeyPlaceholder: string;
                envValuePlaceholder: string;
                envAdd: string;
                envShow: string;
                envHide: string;
                envRemove: string;
                noEnv: string;
            };
        };
        profiles: {
            title: string;
            tabs: {
                profiles: string;
                exportImport: string;
            };
            emptyTitle: string;
            emptyBody: string;
            saveCurrent: string;
        };
        activity: {
            title: string;
            subtitle: string;
            recent: string;
            allSessions: string;
            searchPlaceholder: string;
            running: string;
            resume: string;
        };
        common: {
            close: string;
            cancel: string;
            save: string;
            saving: string;
            delete: string;
            confirm: string;
            copy: string;
            copied: string;
            loading: string;
            search: string;
        };
    };
};
export declare function getResource(lang: SupportedLanguage): typeof en;
//# sourceMappingURL=index.d.ts.map