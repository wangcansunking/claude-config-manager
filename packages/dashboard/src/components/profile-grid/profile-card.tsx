'use client';

import { Tag } from '../shared/tag';
import { Button } from '../shared/button';

export interface Profile {
  name: string;
  createdAt: string;
  updatedAt: string;
  plugins: unknown[];
  mcpServers: Record<string, unknown>;
  settings: Record<string, unknown>;
  commands: unknown[];
  hooks: Record<string, unknown>;
  description?: string;
  active?: boolean;
}

interface ProfileCardProps {
  profile: Profile;
  onActivate: () => void;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function ProfileCard({ profile, onActivate, onEdit, onExport, onDelete }: ProfileCardProps) {
  const pluginCount = profile.plugins?.length ?? 0;
  const mcpCount = Object.keys(profile.mcpServers ?? {}).length;

  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-4"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: profile.active ? '1px solid var(--accent)' : '1px solid var(--card-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium text-base shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
              {profile.name}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
              Created {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {profile.active && <Tag label="Active" variant="green" />}
      </div>

      {/* Component counts */}
      <div className="flex flex-wrap gap-1.5">
        <Tag label={`${pluginCount} plugins`} variant="purple" />
        <Tag label={`${mcpCount} MCPs`} variant="blue" />
        {profile.commands?.length > 0 && (
          <Tag label={`${profile.commands.length} commands`} variant="gray" />
        )}
      </div>

      {/* Description */}
      {profile.description && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{profile.description}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={profile.active ? 'ghost' : 'primary'}
          size="sm"
          onClick={onActivate}
          disabled={profile.active}
        >
          {profile.active ? 'Active' : 'Activate'}
        </Button>
        <Button variant="secondary" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="secondary" size="sm" onClick={onExport}>Export</Button>
        <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}
