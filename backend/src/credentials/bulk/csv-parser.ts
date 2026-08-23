import { parse } from 'csv-parse/sync';

// Common header spellings institutions might export from Excel/Sheets,
// normalized (lowercased, spaces/underscores/dashes stripped) and mapped
// onto the canonical field names the rest of the app uses.
const HEADER_ALIASES: Record<string, string> = {
  studentname: 'studentName',
  name: 'studentName',
  studentrollno: 'studentRollNo',
  rollno: 'studentRollNo',
  rollnumber: 'studentRollNo',
  registrationno: 'studentRollNo',
  registrationnumber: 'studentRollNo',
  regno: 'studentRollNo',
  coursename: 'courseName',
  course: 'courseName',
  degree: 'courseName',
  program: 'courseName',
  cgpa: 'cgpa',
  grade: 'cgpa',
  overallcgpa: 'cgpa',
  marks: 'cgpa',
  issuedate: 'issueDate',
  date: 'issueDate',
  dateofissue: 'issueDate',
};

export const REQUIRED_CSV_FIELDS = [
  'studentName',
  'studentRollNo',
  'courseName',
  'cgpa',
  'issueDate',
] as const;

export interface ParsedCsvRow {
  rowNumber: number;
  studentName: string;
  studentRollNo: string;
  courseName: string;
  cgpa: string;
  issueDate: string;
  errors: string[];
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function parseCredentialsCsv(buffer: Buffer): ParsedCsvRow[] {
  let records: Record<string, string>[];
  try {
    records = parse(buffer, {
      columns: (headerRow: string[]) => headerRow.map((h) => HEADER_ALIASES[normalizeHeader(h)] || h.trim()),
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (err) {
    throw new Error(`Could not parse CSV: ${(err as Error).message}`);
  }

  const rows = records.map((record, i) => {
    const row = { rowNumber: i + 2 } as ParsedCsvRow; // +2: header is line 1, data starts at line 2
    const errors: string[] = [];

    for (const field of REQUIRED_CSV_FIELDS) {
      const value = (record[field] ?? '').toString().trim();
      (row as any)[field] = value;
      if (!value) {
        errors.push(`${field} is missing`);
      }
    }

    row.errors = errors;
    return row;
  });

  // Flag every row sharing a roll number with another row in this same
  // file — not just the 2nd+ occurrence — so the institution can see and
  // fix every conflicting row in one pass instead of re-uploading repeatedly.
  const rowsByRollNo = new Map<string, ParsedCsvRow[]>();
  for (const row of rows) {
    if (!row.studentRollNo) continue;
    const group = rowsByRollNo.get(row.studentRollNo);
    if (group) group.push(row);
    else rowsByRollNo.set(row.studentRollNo, [row]);
  }
  for (const group of rowsByRollNo.values()) {
    if (group.length < 2) continue;
    const rowNumbers = group.map((r) => r.rowNumber).join(', ');
    for (const row of group) {
      row.errors.push(`studentRollNo "${row.studentRollNo}" is duplicated in this file (rows ${rowNumbers})`);
    }
  }

  return rows;
}
