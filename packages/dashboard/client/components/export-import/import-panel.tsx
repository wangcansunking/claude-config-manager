import { useState, useRef } from 'react';
import { Button } from '../shared/button';
import { importProfile } from '@/lib/api-client';

export function ImportPanel() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        setPreview(parsed);
      } catch {
        setPreview({ raw: text.slice(0, 200) });
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport(strategy: 'merge' | 'replace') {
    if (!fileContent) return;
    setImporting(true);
    setImportResult(null);
    try {
      await importProfile(fileContent, strategy);
      setImportResult(`Import successful (${strategy} strategy applied).`);
    } catch (err) {
      setImportResult(`Import failed: ${(err as Error).message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div
      className="rounded-lg p-5 h-full"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <h2 className="text-base mb-4" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
        Import
      </h2>

      {/* Drop zone */}
      <div
        className="rounded-lg border-2 border-dashed p-8 text-center mb-4 cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? 'var(--accent)' : 'var(--card-border)',
          backgroundColor: dragging ? 'rgba(94, 106, 210, 0.05)' : 'transparent',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,.yaml,.yml"
          className="hidden"
          onChange={handleInputChange}
        />
        <svg
          className="w-8 h-8 mx-auto mb-2"
          style={{ color: 'var(--text-muted)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {fileName ? (
          <p className="text-sm" style={{ color: 'var(--accent-light)', fontWeight: 510 }}>{fileName}</p>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontWeight: 510 }}>
              Drop JSON or YAML file here
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              or click to browse
            </p>
          </>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-4">
          <h3 className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)', fontWeight: 510 }}>
            Preview
          </h3>
          <pre
            className="text-xs rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            {JSON.stringify(preview, null, 2).slice(0, 600)}
            {JSON.stringify(preview, null, 2).length > 600 ? '\n...' : ''}
          </pre>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div
          className="rounded-lg px-4 py-2.5 mb-4 text-sm"
          style={{
            backgroundColor: importResult.includes('failed')
              ? 'rgba(255, 71, 87, 0.1)'
              : 'rgba(39, 166, 68, 0.1)',
            color: importResult.includes('failed') ? 'var(--status-red)' : 'var(--status-green)',
          }}
        >
          {importResult}
        </div>
      )}

      {/* Import buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={() => handleImport('merge')}
          disabled={!fileContent || importing}
        >
          {importing ? 'Importing...' : 'Merge (keep existing)'}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() => handleImport('replace')}
          disabled={!fileContent || importing}
        >
          Replace All
        </Button>
      </div>
    </div>
  );
}
