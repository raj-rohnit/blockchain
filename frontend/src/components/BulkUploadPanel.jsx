import { useRef, useState } from 'react';
import api from '../api.js';

const SAMPLE_CSV = `studentName,studentRollNo,courseName,cgpa,issueDate
Rahul Sharma,CS2021045,B.Tech Computer Science,9.1,2025-06-15
Priya Nair,CS2021046,B.Tech Computer Science,8.8,2025-06-15
`;

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'credential-upload-sample.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function BulkUploadPanel({ onIssued }) {
  const [fileName, setFileName] = useState('');
  const [report, setReport] = useState(null);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setReport(null);
    setSuccessCount(null);
    setFileName(file.name);
    setValidating(true);
    try {
      const res = await api.validateBulkCsv(file);
      setReport(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  }

  async function handleCommit() {
    if (!report || !report.allValid) return;
    setCommitting(true);
    setError('');
    try {
      const rows = report.validRows.map(({ studentName, studentRollNo, courseName, cgpa, issueDate }) => ({
        studentName,
        studentRollNo,
        courseName,
        cgpa,
        issueDate,
      }));
      const res = await api.commitBulkIssue(rows);
      setSuccessCount(res.issuedCount);
      setReport(null);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onIssued?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setCommitting(false);
    }
  }

  function handleReset() {
    setReport(null);
    setError('');
    setSuccessCount(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div>
      <p>
        Upload a CSV of students to issue many credentials at once. Every row is checked for missing
        fields, duplicate roll numbers within the file, and roll numbers already registered at your
        institution — the batch is only written to the chain once every row is clean.
      </p>

      <div className="bulk-toolbar">
        <button type="button" className="btn btn-ghost" onClick={downloadSampleCsv}>
          Download sample CSV
        </button>
      </div>

      <div className="field">
        <label htmlFor="bulk-csv">CSV file</label>
        <input
          id="bulk-csv"
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
        />
      </div>

      {validating && <p>Validating {fileName}…</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {successCount !== null && (
        <div className="alert alert-success">
          {successCount} credential{successCount === 1 ? '' : 's'} issued successfully.
        </div>
      )}

      {report && (
        <div className="bulk-report">
          <div className="bulk-summary">
            <div className="bulk-stat">
              <span className="bulk-stat-num">{report.totalRows}</span>
              <span className="bulk-stat-label">Total rows</span>
            </div>
            <div className="bulk-stat bulk-stat-success">
              <span className="bulk-stat-num">{report.validCount}</span>
              <span className="bulk-stat-label">Complete</span>
            </div>
            <div className="bulk-stat bulk-stat-danger">
              <span className="bulk-stat-num">{report.invalidCount}</span>
              <span className="bulk-stat-label">Incomplete</span>
            </div>
          </div>

          {report.allValid ? (
            <div className="alert alert-success">
              Every row is complete. Ready to issue all {report.validCount} credentials.
            </div>
          ) : (
            <div className="alert alert-error">
              Fix the rows below (or re-upload a corrected file) before anything can be issued — the
              whole batch is blocked until every row is complete.
            </div>
          )}

          {report.invalidRows.length > 0 && (
            <div className="bulk-table-wrap">
              <table className="bulk-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Student</th>
                    <th>Problem</th>
                  </tr>
                </thead>
                <tbody>
                  {report.invalidRows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>{row.studentName || <em>(blank)</em>}</td>
                      <td className="bulk-error-cell">{row.errors.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bulk-actions">
            <button
              className="btn btn-primary"
              type="button"
              disabled={!report.allValid || committing}
              onClick={handleCommit}
            >
              {committing && <span className="spinner" />}
              {committing ? 'Issuing…' : `Issue all ${report.validCount} credentials`}
            </button>
            <button className="btn btn-ghost" type="button" onClick={handleReset}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
