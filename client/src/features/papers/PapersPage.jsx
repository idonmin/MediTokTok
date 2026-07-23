import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { CsvExportButton } from './CsvExportButton.jsx';
import { PaperFilters } from './PaperFilters.jsx';

const initialFilters = {
  searchMode: 'pmid',
  searchTerm: '',
  startYear: '',
  endYear: '',
  journal: '',
};

const pageSize = 20;

function buildQuery(filters, page) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  Object.entries(filters).forEach(([key, value]) => {
    if (String(value).trim() !== '') params.set(key, String(value).trim());
  });
  return params.toString();
}

function getArticleLink(paper) {
  if (paper.pmcid) return { href: `https://pmc.ncbi.nlm.nih.gov/articles/${paper.pmcid}/`, label: 'PMC' };
  if (paper.doi) return { href: `https://doi.org/${encodeURIComponent(paper.doi)}`, label: 'DOI' };
  return { href: `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, label: 'PubMed' };
}

export function PapersPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadPapers = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get(`/papers?${buildQuery(appliedFilters, page)}`);
        if (!active) return;
        setRows(data.items || []);
        setTotal(data.total || 0);
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || '논문 목록을 불러오지 못했습니다.');
        setRows([]);
        setTotal(0);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPapers();

    return () => {
      active = false;
    };
  }, [appliedFilters, page]);

  const search = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h1>수집 논문 목록</h1>
          <p className="page-description">PMID, 제목, 저널, 연도로 수집된 논문을 검색할 수 있습니다.</p>
        </div>
        <CsvExportButton filters={appliedFilters} />
      </div>

      <PaperFilters filters={filters} onChange={setFilters} onSubmit={search} />

      {error && <p className="demo-note">{error}</p>}

      <div className="pagination-row pagination-top">
        <button className="button button-ghost" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
          이전
        </button>
        <span className="pagination-status">{page} / {totalPages} 페이지 · 총 {total}건</span>
        <button className="button button-ghost" type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || loading}>
          다음
        </button>
      </div>

      <div className="table-wrap clay-panel">
        <table>
          <thead>
            <tr>
              <th>PMID</th>
              <th>연도</th>
              <th>제목</th>
              <th>저널</th>
              <th>원문보기</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((paper) => {
              const articleLink = getArticleLink(paper);
              return (
                <tr key={paper.pmid}>
                  <td>{paper.pmid}</td>
                  <td>{paper.pub_year ?? <span className="cell-placeholder">—</span>}</td>
                  <td>{paper.title}</td>
                  <td>{paper.journal || '-'}</td>
                  <td>
                    <a className={`paper-link source-${articleLink.label.toLowerCase()}`} href={articleLink.href} target="_blank" rel="noreferrer">
                      원문보기
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <p className="empty-state">논문 목록을 불러오는 중...</p>}
        {!loading && !rows.length && <p className="empty-state">검색 결과가 없습니다.</p>}
      </div>
    </section>
  );
}
