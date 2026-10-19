import API_CONFIG from '../config/api.config'

// Client-side screening for spreadsheet uploads. This is defence in depth only —
// the API must still validate and scan every file, since these checks can be bypassed.

export type UploadKind = 'csv' | 'xlsx'

const MAX_UNCOMPRESSED_XLSX = 100 * 1024 * 1024
const MAX_ZIP_ENTRIES = 2000

const EXECUTABLE_EXTENSIONS = new Set([
  'exe', 'dll', 'com', 'bat', 'cmd', 'msi', 'scr', 'pif', 'cpl', 'jar', 'js', 'jse', 'vbs', 'vbe',
  'wsf', 'wsh', 'ps1', 'psm1', 'hta', 'lnk', 'reg', 'sh', 'app', 'dmg', 'iso', 'xlsm', 'xlsb', 'xltm', 'xlam', 'docm',
])

// Leading bytes of formats that must never arrive disguised as a CSV.
const BINARY_SIGNATURES: Array<{ name: string; bytes: number[] }> = [
  { name: 'Windows executable', bytes: [0x4d, 0x5a] },
  { name: 'ELF executable', bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { name: 'Mach-O executable', bytes: [0xcf, 0xfa, 0xed, 0xfe] },
  { name: 'ZIP archive', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { name: 'legacy Office document', bytes: [0xd0, 0xcf, 0x11, 0xe0] },
  { name: 'PDF', bytes: [0x25, 0x50, 0x44, 0x46] },
  { name: 'RAR archive', bytes: [0x52, 0x61, 0x72, 0x21] },
  { name: '7z archive', bytes: [0x37, 0x7a, 0xbc, 0xaf] },
]

const startsWith = (data: Uint8Array, sig: number[]) => sig.every((b, i) => data[i] === b)

function extensionsOf(name: string): string[] {
  return name.toLowerCase().split('.').slice(1)
}

function checkName(file: File, kinds: UploadKind[]): string | null {
  const exts = extensionsOf(file.name)
  const last = exts[exts.length - 1]
  if (!last || !kinds.includes(last as UploadKind)) {
    return `Only ${kinds.map((k) => `.${k}`).join(' or ')} files are accepted`
  }
  // Catches names like "budget.exe.csv" used to disguise executables.
  if (exts.slice(0, -1).some((ext) => EXECUTABLE_EXTENSIONS.has(ext))) {
    return 'File name contains a blocked extension'
  }
  return null
}

function inspectXlsx(data: Uint8Array): string | null {
  if (!startsWith(data, [0x50, 0x4b, 0x03, 0x04])) return 'File is not a valid Excel (.xlsx) workbook'

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  // Locate the end-of-central-directory record (within the last 64 KB + 22 bytes).
  let eocd = -1
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) return 'Excel workbook is corrupt or truncated'

  const entryCount = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  if (entryCount === 0xffff || offset === 0xffffffff) return 'Excel workbook uses an unsupported (ZIP64) format'
  if (entryCount > MAX_ZIP_ENTRIES) return 'Excel workbook contains too many parts'

  const decoder = new TextDecoder()
  const names: string[] = []
  let totalUncompressed = 0
  for (let n = 0; n < entryCount; n += 1) {
    if (offset + 46 > data.length || view.getUint32(offset, true) !== 0x02014b50) {
      return 'Excel workbook is corrupt or truncated'
    }
    const flags = view.getUint16(offset + 8, true)
    const uncompressed = view.getUint32(offset + 24, true)
    const nameLen = view.getUint16(offset + 28, true)
    const extraLen = view.getUint16(offset + 30, true)
    const commentLen = view.getUint16(offset + 32, true)
    if (flags & 0x1) return 'Encrypted or password-protected workbooks are not accepted'
    totalUncompressed += uncompressed
    names.push(decoder.decode(data.subarray(offset + 46, offset + 46 + nameLen)).toLowerCase())
    offset += 46 + nameLen + extraLen + commentLen
  }

  if (totalUncompressed > MAX_UNCOMPRESSED_XLSX) return 'Excel workbook expands to an unsafe size'
  if (!names.includes('[content_types].xml') || !names.includes('xl/workbook.xml')) {
    return 'File is not a valid Excel (.xlsx) workbook'
  }
  if (names.some((name) => name.endsWith('vbaproject.bin'))) return 'Workbooks containing macros are not accepted'
  if (names.some((name) => name.startsWith('xl/activex/') || name.startsWith('xl/embeddings/'))) {
    return 'Workbooks with embedded objects or ActiveX controls are not accepted'
  }
  if (names.some((name) => name.startsWith('xl/externallinks/'))) {
    return 'Workbooks with external links are not accepted'
  }
  return null
}

// Splits CSV text into cells, honouring quoted values.
function csvCells(text: string): Array<{ line: number; value: string }> {
  const cells: Array<{ line: number; value: string }> = []
  let value = '', quoted = false, line = 1, cellLine = 1
  const push = () => { cells.push({ line: cellLine, value }); value = ''; cellLine = line }
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1 }
      else if (char === '"') quoted = false
      else { value += char; if (char === '\n') line += 1 }
    } else if (char === '"') quoted = true
    else if (char === ',') push()
    else if (char === '\n') { line += 1; push() }
    else if (char !== '\r') value += char
  }
  if (value) push()
  return cells
}

const NUMERIC = /^[+-]?[\d,]*\.?\d+%?$/

// Cells Excel would execute as a formula when the CSV is opened (CSV/DDE injection).
function isFormulaCell(raw: string): boolean {
  const value = raw.trimStart()
  if (!value) return false
  const first = value[0]
  if (first === '=' || first === '@' || first === '\t' || first === '\r') return true
  if ((first === '+' || first === '-') && !NUMERIC.test(value.trim())) return true
  return false
}

function inspectCsv(data: Uint8Array): string | null {
  const binary = BINARY_SIGNATURES.find((sig) => startsWith(data, sig.bytes))
  if (binary) return `File is a ${binary.name}, not a CSV`
  // UTF-16 CSVs contain NUL bytes but start with a BOM; reject anything else that does.
  const utf16 = startsWith(data, [0xff, 0xfe]) || startsWith(data, [0xfe, 0xff])
  if (!utf16 && data.includes(0)) return 'File contains binary data and is not a valid CSV'

  const text = new TextDecoder(utf16 ? (data[0] === 0xff ? 'utf-16le' : 'utf-16be') : 'utf-8').decode(data)
  const formula = csvCells(text).find((cell) => isFormulaCell(cell.value))
  if (formula) {
    const preview = formula.value.trim().slice(0, 40)
    return `Line ${formula.line} contains a formula or command ("${preview}"). Cells must not start with =, +, - or @ unless they are numbers.`
  }
  return null
}

/** Returns a user-facing reason the file is rejected, or null if it passes screening. */
export async function screenUpload(
  file: File,
  kinds: UploadKind[],
  maxBytes: number = API_CONFIG.MAX_FILE_SIZE,
): Promise<string | null> {
  const nameError = checkName(file, kinds)
  if (nameError) return nameError
  if (file.size === 0) return 'File is empty'
  if (file.size > maxBytes) return `File must not exceed ${Math.round(maxBytes / (1024 * 1024))} MB`

  const data = new Uint8Array(await file.arrayBuffer())
  return extensionsOf(file.name).pop() === 'xlsx' ? inspectXlsx(data) : inspectCsv(data)
}
