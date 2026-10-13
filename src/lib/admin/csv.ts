/** Prefix formula-like cells so spreadsheet apps do not execute them. */
export function csvSafeCell(value: string | number | null | undefined): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(s)) {
    s = `'${s}`;
  }
  if (/[",\r\n]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** UTF-8 CSV with BOM for Excel-friendly open. */
export function buildCsv(rows: Array<Array<string | number | null | undefined>>): string {
  const body = rows.map((row) => row.map(csvSafeCell).join(',')).join('\r\n');
  return `\uFEFF${body}`;
}

export function csvResponse(
  body: string,
  fileName: string
): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
