import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const templatePath = 'C:\\Users\\Ejinne\\Desktop\\Tailwind\\police-budget-new\\public\\AIE_Upload_Template.xlsx';
const template = await FileBlob.load(templatePath);
const workbook = await SpreadsheetFile.importXlsx(template);
const source = JSON.parse(await fs.readFile(path.join(outputDir, 'source_data.json'), 'utf8'));
const monthNames = ['January', 'February', 'March'];
const releaseRefs = [...new Set(source.actualRows.map((row) => row.releaseRef))];
const releaseAmounts = new Map(releaseRefs.map((ref) => [ref, source.actualRows
  .filter((row) => row.releaseRef === ref)
  .reduce((sum, row) => sum + row.amount, 0)]));
const maxRefsPerMonth = Math.ceil(releaseRefs.length / monthNames.length);
const monthBuckets = monthNames.map((month) => ({ month, refs: [], amount: 0 }));
for (const ref of [...releaseRefs].sort((a, b) => releaseAmounts.get(b) - releaseAmounts.get(a))) {
  const bucket = monthBuckets
    .filter((item) => item.refs.length < maxRefsPerMonth)
    .sort((a, b) => a.amount - b.amount)[0];
  bucket.refs.push(ref);
  bucket.amount += releaseAmounts.get(ref);
}
const monthByRef = new Map(monthBuckets.flatMap((bucket) => bucket.refs.map((ref) => [ref, bucket.month])));
const budgetData = source.budgetRows;
const actualData = source.actualRows.map((row) => {
  const note = 'Even by value; date blank';
  const remark = row.remark ? `${row.remark} | ${note}` : note;
  return [
    row.releaseRef,
    row.budgetCode,
    monthByRef.get(row.releaseRef),
    row.amount,
    row.releaseDate ? new Date(row.releaseDate) : null,
    row.description ?? null,
    remark,
    row.sourceTab,
    row.fiscalYear,
  ];
});

const budgetsSheet = workbook.worksheets.getItem('Budgets');
const actualsSheet = workbook.worksheets.getItem('Actuals');
budgetsSheet.getRange(`A2:D${budgetData.length + 1}`).values = budgetData;
actualsSheet.getRange(`A2:I${actualData.length + 1}`).values = actualData;
workbook.recalculate();

const budgetCheck = await workbook.inspect({
  kind: 'table',
  sheetId: budgetsSheet.name,
  range: `A1:D${budgetData.length + 1}`,
  maxChars: 4000,
  tableMaxRows: 7,
  tableMaxCols: 4,
});
const actualsCheck = await workbook.inspect({
  kind: 'table',
  sheetId: actualsSheet.name,
  range: `A1:I${actualData.length + 1}`,
  maxChars: 4000,
  tableMaxRows: 7,
  tableMaxCols: 9,
});
console.log(budgetCheck.ndjson);
console.log(actualsCheck.ndjson);

for (const sheetName of ['Budgets', 'Actuals']) {
  const preview = await workbook.render({ sheetName, range: 'A1:I12', scale: 1, format: 'png' });
  await fs.writeFile(path.join(outputDir, `${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const outputPath = path.join(outputDir, '2026_Direct_AIE_Backend_Upload.xlsx');
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);
const exportedWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const exportedBudgetCheck = await exportedWorkbook.inspect({
  kind: 'table',
  sheetId: 'Budgets',
  range: `A1:D${budgetData.length + 1}`,
  maxChars: 3000,
  tableMaxRows: 6,
  tableMaxCols: 4,
});
const exportedActualCheck = await exportedWorkbook.inspect({
  kind: 'table',
  sheetId: 'Actuals',
  range: `A1:I${actualData.length + 1}`,
  maxChars: 3000,
  tableMaxRows: 6,
  tableMaxCols: 9,
});
console.log('EXPORTED BUDGET CHECK');
console.log(exportedBudgetCheck.ndjson);
console.log('EXPORTED ACTUAL CHECK');
console.log(exportedActualCheck.ndjson);
console.log(JSON.stringify({
  outputPath,
  budgetRows: budgetData.length,
  actualRows: actualData.length,
  releaseRefs: releaseRefs.length,
  releaseRefsPerMonth: Object.fromEntries(monthNames.map((month) => [month, releaseRefs.filter((ref) => monthByRef.get(ref) === month).length])),
  actualRowsPerMonth: Object.fromEntries(monthNames.map((month) => [month, actualData.filter((row) => row[2] === month).length])),
  actualAmountsPerMonth: Object.fromEntries(monthNames.map((month) => [month, actualData.filter((row) => row[2] === month).reduce((sum, row) => sum + row[3], 0)])),
  actualAmountSum: actualData.reduce((sum, row) => sum + row[3], 0),
}, null, 2));
