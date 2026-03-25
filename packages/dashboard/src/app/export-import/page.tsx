'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { ExportPanel } from '@/components/export-import/export-panel';
import { ImportPanel } from '@/components/export-import/import-panel';
import { fetchProfiles } from '@/lib/api-client';

interface Profile {
  name: string;
}

export default function ExportImportPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProfiles();
        setProfiles(data as Profile[]);
      } catch (err) {
        console.error('Failed to load profiles', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <Header title="Export / Import" />

      {loading ? (
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <ExportPanel profiles={profiles} />
          <ImportPanel />
        </div>
      )}
    </div>
  );
}
