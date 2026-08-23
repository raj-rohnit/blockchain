import { useRef, useState } from 'react';
import api from '../api.js';

function parseQueries(raw) {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function StatusPill({ result }) {
  if (!result.found) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-red-400">
        Not found
      </span>
    );
  }
  if (result.status === 'revoked') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
        Revoked
      </span>
    );
  }
  if (!result.valid) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-red-400">
        Chain broken
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
      Valid
    </span>
  );
}

export default function BulkVerify() {
  const [raw, setRaw] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const queries = parseQueries(raw);

  async function handleSubmit(e) {
    e.preventDefault();
    if (queries.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.verifyBulk(queries);
      setResults(res.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileLoading(true);
    setError('');
    try {
      const res = await api.verifyBulkFile(file);
      setResults(res.results);
      setRaw('');
    } catch (err) {
      setError(err.message);
    } finally {
      setFileLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleClear() {
    setRaw('');
    setResults(null);
    setError('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const foundCount = results?.filter((r) => r.found).length ?? 0;
  const validCount = results?.filter((r) => r.found && r.valid).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-text">Bulk credential verification</h2>
        <p className="text-sm text-text-muted">
          Upload an Excel/CSV file of applicants, or paste a list of credential IDs or student roll
          numbers — one per line, or comma-separated — to verify many at once against the hash chain.
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-dashed border-border bg-bg-card p-6 text-center transition-colors hover:border-brand">
        <label htmlFor="bulk-verify-file" className="cursor-pointer">
          <div className="text-sm font-medium text-text">
            {fileLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="spinner" /> Verifying {fileName}…
              </span>
            ) : (
              <>📄 Upload an Excel (.xlsx) or CSV file of roll numbers / credential IDs</>
            )}
          </div>
          <div className="mt-1 text-xs text-text-muted">Any layout works — one column of values is enough</div>
        </label>
        <input
          id="bulk-verify-file"
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          disabled={fileLoading}
          className="hidden"
        />
      </div>

      <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-wide text-text-muted">
        <div className="h-px flex-1 bg-border" />
        or paste manually
        <div className="h-px flex-1 bg-border" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-bg-card p-6 shadow-lg shadow-black/20 transition-shadow"
      >
        <label htmlFor="bulk-queries" className="mb-2 block text-sm font-medium text-text-muted">
          Credential IDs / roll numbers
        </label>
        <textarea
          id="bulk-queries"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={7}
          placeholder={'CS2021045\nCS2021046\nb6a59046-850b-4886-a27e-acc4ec29f25c'}
          className="w-full resize-y rounded-lg border border-border bg-bg-elevated px-3 py-2.5 font-mono text-sm text-text outline-none transition-colors focus:border-brand"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || queries.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition-all hover:enabled:-translate-y-0.5 hover:enabled:shadow-lg hover:enabled:shadow-brand/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <span className="spinner" />}
            {loading ? 'Verifying…' : `Verify ${queries.length || ''} ${queries.length === 1 ? 'entry' : 'entries'}`.trim()}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg-elevated"
          >
            Clear
          </button>
          {queries.length > 0 && (
            <span className="text-xs text-text-muted">{queries.length} queued</span>
          )}
        </div>
      </form>

      {error && (
        <div className="alert alert-error mt-4">{error}</div>
      )}

      {results && (
        <div className="mt-6 animate-[modal-scale-in_0.18s_ease-out]">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-bg-elevated py-3 text-center">
              <div className="text-xl font-bold text-text">{results.length}</div>
              <div className="text-xs text-text-muted">Queries</div>
            </div>
            <div className="rounded-lg border border-border bg-bg-elevated py-3 text-center">
              <div className="text-xl font-bold text-emerald-400">{validCount}</div>
              <div className="text-xs text-text-muted">Valid</div>
            </div>
            <div className="rounded-lg border border-border bg-bg-elevated py-3 text-center">
              <div className="text-xl font-bold text-red-400">{results.length - validCount}</div>
              <div className="text-xs text-text-muted">Not valid / not found</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-bg-elevated text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Query</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Student</th>
                    <th className="px-4 py-3 text-left font-semibold">Institution</th>
                    <th className="px-4 py-3 text-left font-semibold">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={`${r.query}-${i}`}
                      className="border-t border-border transition-colors hover:bg-bg-elevated"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-text-muted">{r.query}</td>
                      <td className="px-4 py-3">
                        <StatusPill result={r} />
                      </td>
                      <td className="px-4 py-3 text-text">{r.found ? r.credential.studentName : '—'}</td>
                      <td className="px-4 py-3 text-text-muted">{r.found ? r.credential.institutionName : '—'}</td>
                      <td className="px-4 py-3 text-text-muted">{r.found ? r.credential.courseName : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
