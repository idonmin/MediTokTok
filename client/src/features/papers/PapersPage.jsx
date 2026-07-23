import { MessageSquareText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPaperConversation } from '../chat/chat.api.js';
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
  return { href: `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, label: 'PubMed' };
}

export function PapersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPmids, setSelectedPmids] = useState(() => new Set());
  const [sending, setSending] = useState(false);
  const [selectionStatus, setSelectionStatus] = useState('');

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
  const selectedCount = selectedPmids.size;

  const togglePaper = (pmid) => {
    setSelectionStatus('');
    if (!selectedPmids.has(pmid) && selectedPmids.size >= 5) {
      setSelectionStatus('논문은 한 번에 최대 5편까지 선택할 수 있습니다.');
      return;
    }
    setSelectedPmids((current) => {
      const next = new Set(current);
      if (next.has(pmid)) {
        next.delete(pmid);
        return next;
      }
      next.add(pmid);
      return next;
    });
  };

  const sendToChat = async () => {
    if (!selectedCount || sending) return;
    setSending(true);
    setSelectionStatus('');
    try {
      const conversation = await createPaperConversation([...selectedPmids]);
      navigate(`/app/chat?room=${conversation.id}`);
    } catch (requestError) {
      setSelectionStatus(requestError.message || '선택한 논문으로 채팅방을 만들지 못했습니다.');
    } finally {
      setSending(false);
    }
  };

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
      {selectionStatus && <p className="paper-selection-status" role="alert">{selectionStatus}</p>}

      <div className="pagination-row pagination-top">
        <button className="button button-ghost" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
          이전
        </button>
        <span className="pagination-status">{page} / {totalPages} 페이지 · 총 {total}건</span>
        <div className="pagination-actions">
          <button
            className="button button-primary send-papers-button"
            type="button"
            onClick={sendToChat}
            disabled={!selectedCount || sending}
          >
            <MessageSquareText size={17} />
            {sending ? '채팅방 생성 중…' : `챗봇으로 보내기${selectedCount ? ` (${selectedCount}/5)` : ''}`}
          </button>
          <button className="button button-ghost" type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || loading}>
            다음
          </button>
        </div>
      </div>

      <div className="table-wrap clay-panel">
        <table>
          <thead>
            <tr>
              <th className="paper-select-column">선택</th>
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
              const selected = selectedPmids.has(paper.pmid);
              return (
                <tr className={selected ? 'selected' : ''} key={paper.pmid}>
                  <td className="paper-select-cell">
                    <label className="paper-checkbox-label">
                      <input
                        className="paper-checkbox"
                        type="checkbox"
                        checked={selected}
                        onChange={() => togglePaper(paper.pmid)}
                        aria-label={`${paper.title} 선택`}
                      />
                      <span aria-hidden="true" />
                    </label>
                  </td>
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
