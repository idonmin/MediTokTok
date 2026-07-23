export function CsvExportButton({ rows }) {
  const download = () => {
    const header = ['pmid', 'pub_year', 'title', 'journal'];
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [header.join(','), ...rows.map((row) => header.map((key) => escape(row[key])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'meditalktalk-papers.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return <button className="button button-ghost" onClick={download} disabled={!rows.length}>CSV 다운로드</button>;
}
