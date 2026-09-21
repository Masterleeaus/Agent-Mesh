'use strict';

// Adapted from the MIT-licensed OpenBrowser file-exporter donor.
// Pure byte/text helpers only: no DOM download action and no filesystem authority.
const encoder = new TextEncoder();
const MAX_EXPORT_NAME = 120;
const MAX_ENTRIES = 500;
const MAX_ENTRY_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 16 * 1024 * 1024;

function sanitizeExportName(value, fallback = 'titan-code-export') {
  const raw = String(value ?? '').trim().replace(/\\/g, '/').split('/').pop() ?? '';
  const normalized = raw
    .replace(/[<>:"|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  const safe = normalized || String(fallback || 'titan-code-export').slice(0, MAX_EXPORT_NAME);
  if (safe.length <= MAX_EXPORT_NAME) return safe;
  const dot = safe.lastIndexOf('.');
  const extension = dot > 0 && safe.length - dot <= 12 ? safe.slice(dot) : '';
  return `${safe.slice(0, MAX_EXPORT_NAME - extension.length)}${extension}`;
}

function buildMarkdownExport(items = [], { title = 'Titan Code export', exportedAt = new Date().toISOString() } = {}) {
  const rows = Array.isArray(items) ? items.slice(0, MAX_ENTRIES) : [];
  const lines = [`# ${String(title).trim().slice(0, 240) || 'Titan Code export'}`, '', `Exported: ${String(exportedAt).slice(0, 80)}`, ''];
  for (const [index, item] of rows.entries()) {
    const name = String(item?.name ?? item?.title ?? `Item ${index + 1}`).trim().slice(0, 240);
    lines.push(`## ${name}`, '');
    if (item?.type) lines.push(`- Type: ${String(item.type).slice(0, 120)}`);
    if (item?.size != null) lines.push(`- Size: ${Number(item.size) || 0} bytes`);
    if (item?.source) lines.push(`- Source: ${String(item.source).slice(0, 1000)}`);
    if (item?.text) lines.push('', String(item.text).slice(0, MAX_ENTRY_BYTES), '');
  }
  return `${lines.join('\n').trim()}\n`;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(out, value) { out.push(value & 0xff, (value >>> 8) & 0xff); }
function u32(out, value) { out.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff); }
function dosDateTime(date = new Date(0)) {
  const year = Math.max(1980, Math.min(2107, date.getUTCFullYear() || 1980));
  return { time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2), date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate() };
}

function normalizeEntry(entry) {
  const parts = String(entry?.name ?? 'file').replace(/\\/g, '/').split('/').filter(Boolean).map(part => sanitizeExportName(part, 'file'));
  const name = parts.join('/') || 'file';
  const data = entry?.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry?.data ?? ''));
  if (data.length > MAX_ENTRY_BYTES) throw new Error('Export entry exceeds bounded size.');
  return { name, data };
}

function createZipBytes(entries = []) {
  const rows = Array.isArray(entries) ? entries : [];
  if (rows.length > MAX_ENTRIES) throw new Error('Export entry count exceeds bounded limit.');
  const normalized = rows.map(normalizeEntry);
  const total = normalized.reduce((sum, row) => sum + row.data.length, 0);
  if (total > MAX_TOTAL_BYTES) throw new Error('Export payload exceeds bounded total size.');
  const local = [], central = [];
  let offset = 0;
  const timestamp = dosDateTime(new Date(Date.UTC(1980, 0, 1)));
  for (const entry of normalized) {
    const nameBytes = encoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const header = [];
    u32(header, 0x04034b50); u16(header, 20); u16(header, 0x0800); u16(header, 0); u16(header, timestamp.time); u16(header, timestamp.date);
    u32(header, checksum); u32(header, entry.data.length); u32(header, entry.data.length); u16(header, nameBytes.length); u16(header, 0);
    local.push(...header, ...nameBytes, ...entry.data);
    const c = [];
    u32(c, 0x02014b50); u16(c, 20); u16(c, 20); u16(c, 0x0800); u16(c, 0); u16(c, timestamp.time); u16(c, timestamp.date);
    u32(c, checksum); u32(c, entry.data.length); u32(c, entry.data.length); u16(c, nameBytes.length); u16(c, 0); u16(c, 0); u16(c, 0); u16(c, 0); u32(c, 0); u32(c, offset);
    central.push(...c, ...nameBytes);
    offset += header.length + nameBytes.length + entry.data.length;
  }
  const end = [];
  u32(end, 0x06054b50); u16(end, 0); u16(end, 0); u16(end, normalized.length); u16(end, normalized.length); u32(end, central.length); u32(end, local.length); u16(end, 0);
  return Uint8Array.from([...local, ...central, ...end]);
}

function capability() {
  return Object.freeze({ schema: 'titan-code-export-utilities/v1', pure_data_only: true, filesystem_authority: false, download_authority: false, execution_authority: false, mutation_authority: false, canonical_authority: false });
}

module.exports = Object.freeze({ sanitizeExportName, buildMarkdownExport, createZipBytes, capability, MAX_ENTRIES, MAX_ENTRY_BYTES, MAX_TOTAL_BYTES });
