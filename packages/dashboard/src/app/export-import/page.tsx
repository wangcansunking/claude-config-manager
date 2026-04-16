'use client';

import { Header } from '@/components/layout/header';
import { ExportPanel } from '@/components/export-import/export-panel';
import { ImportPanel } from '@/components/export-import/import-panel';
import { useProfiles } from '@/lib/use-data';

interface Profile {
  name: string;
}

export default function ExportImportPage() {
  const { data: profilesRaw, isLoading: loading } = useProfiles();
  const profiles = (profilesRaw ?? []) as Profile[];

  return (
    <div>
      <Header title="Export / Import" />

      {loading ? (
        <p style={{ color: '#d0d6e0' }}>Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <ExportPanel profiles={profiles} />
          <ImportPanel />
        </div>
      )}
    </div>
  );
}
