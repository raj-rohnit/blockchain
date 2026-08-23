import { read, utils } from 'xlsx';

const MAX_QUERIES = 500;

// Labels that show up as a header cell rather than an actual roll number /
// credential ID, so a header row in the uploaded sheet isn't treated as a
// query by mistake.
const HEADER_LABELS = new Set([
  'rollno',
  'rollnumber',
  'registrationno',
  'registrationnumber',
  'regno',
  'studentrollno',
  'credentialid',
  'id',
  'query',
  'studentname',
  'name',
]);

function normalize(cell: string): string {
  return cell.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

/**
 * Extracts a flat list of candidate roll numbers / credential IDs from an
 * uploaded spreadsheet (.xlsx, .xls, or .csv). No fixed column layout is
 * assumed — every non-empty cell in the first sheet is a candidate, minus
 * recognizable header labels and duplicates, since institution staff are
 * more likely to hand over "a list of roll numbers" than a strictly
 * formatted file.
 */
export function parseBulkVerifyFile(buffer: Buffer): string[] {
  let workbook;
  try {
    workbook = read(buffer, { type: 'buffer' });
  } catch (err) {
    throw new Error(`Could not parse spreadsheet: ${(err as Error).message}`);
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rows: unknown[][] = utils.sheet_to_json(sheet, { header: 1, blankrows: false });

  const seen = new Set<string>();
  const queries: string[] = [];

  for (const row of rows) {
    for (const cell of row) {
      if (cell === null || cell === undefined) continue;
      const value = String(cell).trim();
      if (!value) continue;
      if (HEADER_LABELS.has(normalize(value))) continue;
      if (seen.has(value)) continue;

      seen.add(value);
      queries.push(value);
      if (queries.length >= MAX_QUERIES) return queries;
    }
  }

  return queries;
}
