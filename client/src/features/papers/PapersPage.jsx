import { useState } from 'react';
import { PaperFilters } from './PaperFilters.jsx';
import { CsvExportButton } from './CsvExportButton.jsx';

const demoRows = [
  { pmid: '41454846', pub_year: 2025, title: 'Annual vaccination with BNT162b2 in Germany', journal: 'Vaccine' },
  { pmid: '41345863', pub_year: 2025, title: 'Long-term Humoral Response of Immunosuppressed Children', journal: 'The Lancet' },
];

export function PapersPage() {
  const [filters, setFilters] = useState({ query: '', startYear: 2022, endYear: 2025, journal: '' });
  const [rows, setRows] = useState(demoRows);
  const search = (event) => {
    event.preventDefault();
    setRows(demoRows.filter((row) => !filters.query || row.title.toLowerCase().includes(filters.query.toLowerCase())));
  };

  return (
    <section className="page-content">
      <div className="page-heading"><div><span className="eyebrow">LIBRARY</span><h1>수집 논문 목록</h1></div><CsvExportButton rows={rows} /></div>
      <PaperFilters filters={filters} onChange={setFilters} onSubmit={search} />
      <div className="table-wrap clay-panel">
        <table><thead><tr><th>PMID</th><th>연도</th><th>제목</th><th>저널</th></tr></thead><tbody>{rows.map((paper) => <tr key={paper.pmid}><td>{paper.pmid}</td><td>{paper.pub_year}</td><td>{paper.title}</td><td>{paper.journal}</td></tr>)}</tbody></table>
        {!rows.length && <p className="empty-state">검색 결과가 없습니다.</p>}
      </div>
      <p className="demo-note">현재 목록은 UI 개발용 예시 데이터입니다. 담당자는 `/api/papers`와 연결하세요.</p>
    </section>
  );
}
