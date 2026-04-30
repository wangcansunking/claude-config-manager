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
            overview: string;
            config: string;
            sessions: string;
            recommend: string;
            settings: string;
            profiles_wip: string;
        };
        footer: {
            nav: string;
            enter: string;
            back: string;
            switch_focus: string;
            filter: string;
            help: string;
            quit: string;
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
            active_profile: string;
            plugins_count: string;
            mcps_count: string;
            skills_count: string;
            commands_count: string;
            recent_sessions: string;
            dashboard: string;
            running: string;
            stopped: string;
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
            count_title: string;
            copy_hint: string;
            empty_title: string;
            empty_hint: string;
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
                hint: string;
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
                hint: string;
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
                hint: string;
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
                model_cycle_hint: string;
                env_copy_hint: string;
            };
        };
        profiles: {
            title: string;
            wip_note: string;
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
        sessions: {
            title: string;
            filter_hint: string;
            no_matches: string;
            no_selected: string;
            no_history_file: string;
            no_input_history: string;
            recent_inputs: string;
            hint: string;
            status_live: string;
            status_ended: string;
            id_prefix: string;
            copy_ok: string;
            copy_fail: string;
        };
        settings_prefs: {
            title: string;
            language: string;
            theme: string;
            quit_confirm: string;
            toggle_hint: string;
            theme_value: string;
            quit_value: string;
            coming_soon: string;
        };
        modals: {
            switch_profile_title: string;
            switch_profile_body: string;
            confirm: string;
            cancel: string;
        };
        toasts: {
            enabled: string;
            disabled: string;
            switched_profile: string;
            model_set: string;
            language_set: string;
            copied: string;
            copy_failed: string;
            switch_failed: string;
            failed_toggle: string;
            failed_generic: string;
            install_cmd_copied: string;
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
            none: string;
            unset: string;
            no_matches: string;
            loading_lower: string;
            unknown: string;
        };
        errors: {
            settings_unreadable: string;
            non_tty: string;
            too_small: string;
        };
        help: {
            title: string;
        };
        header: {
            dashboard: string;
            running: string;
            stopped: string;
        };
    };
    readonly zh: {
        nav: {
            dashboard: string;
            recommended: string;
            configuration: string;
            profiles: string;
            activity: string;
            overview: string;
            config: string;
            sessions: string;
            recommend: string;
            settings: string;
            profiles_wip: string;
        };
        footer: {
            nav: string;
            enter: string;
            back: string;
            switch_focus: string;
            filter: string;
            help: string;
            quit: string;
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
            active_profile: string;
            plugins_count: string;
            mcps_count: string;
            skills_count: string;
            commands_count: string;
            recent_sessions: string;
            dashboard: string;
            running: string;
            stopped: string;
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
            count_title: string;
            copy_hint: string;
            empty_title: string;
            empty_hint: string;
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
                hint: string;
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
                hint: string;
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
                hint: string;
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
                model_cycle_hint: string;
                env_copy_hint: string;
            };
        };
        profiles: {
            title: string;
            wip_note: string;
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
        sessions: {
            title: string;
            filter_hint: string;
            no_matches: string;
            no_selected: string;
            no_history_file: string;
            no_input_history: string;
            recent_inputs: string;
            hint: string;
            status_live: string;
            status_ended: string;
            id_prefix: string;
            copy_ok: string;
            copy_fail: string;
        };
        settings_prefs: {
            title: string;
            language: string;
            theme: string;
            quit_confirm: string;
            toggle_hint: string;
            theme_value: string;
            quit_value: string;
            coming_soon: string;
        };
        modals: {
            switch_profile_title: string;
            switch_profile_body: string;
            confirm: string;
            cancel: string;
        };
        toasts: {
            enabled: string;
            disabled: string;
            switched_profile: string;
            model_set: string;
            language_set: string;
            copied: string;
            copy_failed: string;
            switch_failed: string;
            failed_toggle: string;
            failed_generic: string;
            install_cmd_copied: string;
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
            none: string;
            unset: string;
            no_matches: string;
            loading_lower: string;
            unknown: string;
        };
        errors: {
            settings_unreadable: string;
            non_tty: string;
            too_small: string;
        };
        help: {
            title: string;
        };
        header: {
            dashboard: string;
            running: string;
            stopped: string;
        };
    };
};
export declare function getResource(lang: SupportedLanguage): typeof en;
//# sourceMappingURL=index.d.ts.map