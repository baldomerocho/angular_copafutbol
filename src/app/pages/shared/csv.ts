/**
 * CSV export.
 *
 * The first thing an organizer asks for is the fixture list on paper and the
 * table in a spreadsheet, so this produces a file rather than a print view.
 *
 * Two details make the difference between a file that opens cleanly and one that
 * does not: a BOM, without which Excel reads UTF-8 as Latin-1 and turns every
 * accent into mojibake, and semicolons, which is the separator Excel expects in
 * the locales this runs in — with a comma it puts the whole row in one cell.
 */

const SEPARATOR = ';';
const BOM = '﻿';

/** Escapes one value. Quotes wrap anything that could break the row apart. */
function cell(value: unknown): string {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (text.includes(SEPARATOR) || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

/** Builds the CSV text from a header row and the rows under it. */
export function toCsv(headers: string[], rows: unknown[][]): string {
    return [headers, ...rows].map((row) => row.map(cell).join(SEPARATOR)).join('\r\n');
}

/**
 * Hands the file to the browser. The anchor is removed straight away; the object
 * URL is released on the next tick, because revoking it synchronously cancels the
 * download in some browsers.
 */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
    const blob = new Blob([BOM + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Turns a title into a safe file name: "Copa Apertura" → "copa-apertura". */
export function slugify(value: string): string {
    return (value || 'export')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
