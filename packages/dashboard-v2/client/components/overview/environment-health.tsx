import { useSettings, useStats } from '@/lib/use-data';

interface Settings {
  model?: string;
  hooks?: Record<string, unknown[]>;
  [key: string]: unknown;
}

interface Stats {
  plugins: number;
  mcpServers: number;
  skills: number;
  profiles: number;
  sessions: number;
}

function HealthRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3 transition-colors"
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-5 h-5 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          {icon}
        </span>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: 'green' | 'blue' | 'yellow' | 'gray' }) {
  const colorMap = {
    green: { bg: 'rgba(39, 166, 68, 0.15)', text: 'var(--status-green)' },
    blue:  { bg: 'rgba(94, 106, 210, 0.15)', text: 'var(--accent-light)' },
    yellow: { bg: 'rgba(138, 143, 152, 0.15)', text: 'var(--text-secondary)' },
    gray:  { bg: 'var(--border)', text: 'var(--text-muted)' },
  };
  const c = colorMap[color];
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full"
      style={{ backgroundColor: c.bg, color: c.text, fontWeight: 510 }}
    >
      {label}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--status-green)' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ModelIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PluginIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
    </svg>
  );
}

function HookIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function EnvIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

export function EnvironmentHealth() {
  const { data: settingsRaw, isLoading: settingsLoading } = useSettings();
  const { data: statsRaw, isLoading: statsLoading } = useStats();

  const isLoading = settingsLoading || statsLoading;
  const settings = (settingsRaw ?? {}) as Settings;
  const stats = statsRaw as Stats | undefined;

  const model = (settings.model as string | undefined) ?? '';
  const hooks = (settings.hooks ?? {}) as Record<string, unknown[]>;
  const hookCount = Object.values(hooks).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  // Env vars count stored under settings.env key or separately; use stats for plugins/mcp
  const envVars = (settings.env ?? {}) as Record<string, string>;
  const envVarCount = Object.keys(envVars).length;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <div
        className="px-5 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h3 className="text-lg" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>Environment Health</h3>
      </div>

      {isLoading ? (
        <div className="px-5 py-6">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      ) : (
        <div>
          {/* Model */}
          <HealthRow icon={<ModelIcon />} label="Model">
            {model ? (
              <>
                <span className="text-sm font-mono" style={{ color: 'var(--accent-light)' }}>
                  {model.length > 30 ? model.slice(0, 28) + '...' : model}
                </span>
                <CheckIcon />
              </>
            ) : (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Not configured</span>
            )}
          </HealthRow>

          {/* Plugins */}
          <HealthRow icon={<PluginIcon />} label="Plugins">
            {stats && stats.plugins > 0 ? (
              <Badge label={`${stats.plugins} active`} color="green" />
            ) : (
              <Badge label="None" color="gray" />
            )}
          </HealthRow>

          {/* MCP Servers */}
          <HealthRow icon={<ServerIcon />} label="MCP Servers">
            {stats && stats.mcpServers > 0 ? (
              <Badge label={`${stats.mcpServers} configured`} color="blue" />
            ) : (
              <Badge label="None" color="gray" />
            )}
          </HealthRow>

          {/* Hooks */}
          <HealthRow icon={<HookIcon />} label="Hooks">
            {hookCount > 0 ? (
              <Badge label={`${hookCount} hook${hookCount !== 1 ? 's' : ''}`} color="yellow" />
            ) : (
              <Badge label="None" color="gray" />
            )}
          </HealthRow>

          {/* Env Vars */}
          <HealthRow icon={<EnvIcon />} label="Env Vars">
            {envVarCount > 0 ? (
              <Badge label={`${envVarCount} set`} color="blue" />
            ) : (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>None set</span>
            )}
          </HealthRow>
        </div>
      )}
    </div>
  );
}
