import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api.js';
import { useAuth } from '../auth/auth-context.js';

const chartYears = '#6f58c9';
const chartYearFill = 'url(#yearGradient)';
const journalPalette = ['#5d43a8', '#7b5ad0', '#8f6ce6', '#a67ff3', '#c18cf7', '#d68df0', '#8a70d6', '#6d55bf'];
const emptyCollectionSummary = {
  inserted: null,
  skipped: null,
  collectedAt: null,
};
const emptyOverview = {
  totalPapers: 0,
  totalJournals: 0,
  latestCollectedAt: null,
  byYear: [],
  journals: [],
};

function formatCompact(value) {
  return new Intl.NumberFormat('ko-KR').format(value ?? 0);
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function truncateLabel(value, maxLength = 18) {
  const label = String(value ?? '');
  return label.length > maxLength ? `${label.slice(0, maxLength)}…` : label;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip clay-panel">
      <strong>{label}</strong>
      <span>{formatCompact(payload[0].value)}편</span>
    </div>
  );
}

function NumberTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip clay-panel">
      <strong>{label}</strong>
      <span>{formatCompact(payload[0].value)}편</span>
    </div>
  );
}

function StatCard({ label, value, caption, tone }) {
  return (
    <article className="stat-card clay-panel" style={{ '--accent': tone }}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  );
}

export function OverviewPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(emptyOverview);
  const [collectionSummary, setCollectionSummary] = useState(emptyCollectionSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [clearing, setClearing] = useState(false);

  const lastCollectionKey = user?.id
    ? `meditalktalk:last-collection:${user.id}`
    : 'meditalktalk:last-collection';

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get('/overview');
        if (!active) return;
        setOverview({
          ...emptyOverview,
          ...data,
        });
      } catch (err) {
        if (!active) return;
        setError(err.message || '개요를 불러오지 못했습니다.');
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadCollectionSummary = () => {
      try {
        const raw = window.localStorage.getItem(lastCollectionKey);
        if (!raw) {
          setCollectionSummary(emptyCollectionSummary);
          return;
        }
        const parsed = JSON.parse(raw);
        setCollectionSummary({
          inserted: Number.isFinite(Number(parsed?.inserted)) ? Number(parsed.inserted) : null,
          skipped: Number.isFinite(Number(parsed?.skipped)) ? Number(parsed.skipped) : null,
          collectedAt: parsed?.collectedAt || null,
        });
      } catch {
        setCollectionSummary(emptyCollectionSummary);
      }
    };

    const syncCollectionSummary = (event) => {
      const detail = event?.detail || {};
      if (Number.isFinite(Number(detail.inserted)) && Number.isFinite(Number(detail.skipped))) {
        const next = {
          inserted: Number(detail.inserted),
          skipped: Number(detail.skipped),
          collectedAt: new Date().toISOString(),
        };
        setCollectionSummary(next);
        window.localStorage.setItem(lastCollectionKey, JSON.stringify(next));
        return;
      }

      setCollectionSummary(emptyCollectionSummary);
      window.localStorage.removeItem(lastCollectionKey);
    };

    const refresh = () => {
      void loadOverview();
    };

    void loadOverview();
    loadCollectionSummary();
    window.addEventListener('papers-collected', refresh);
    window.addEventListener('pubmed-records-changed', refresh);
    window.addEventListener('papers-collected', syncCollectionSummary);
    window.addEventListener('pubmed-records-changed', syncCollectionSummary);

    return () => {
      active = false;
      window.removeEventListener('papers-collected', refresh);
      window.removeEventListener('pubmed-records-changed', refresh);
      window.removeEventListener('papers-collected', syncCollectionSummary);
      window.removeEventListener('pubmed-records-changed', syncCollectionSummary);
    };
  }, [lastCollectionKey]);

  const latestCollectedAt = overview.latestCollectedAt;
  const summaryCards = [
    {
      label: '전체 수집 논문',
      value: formatCompact(overview.totalPapers),
      caption: '내 수집 목록의 논문 수',
      tone: '#6f58c9',
    },
    {
      label: '신규 저장',
      value: collectionSummary.inserted != null ? formatCompact(collectionSummary.inserted) : '—',
      caption: '최근 수집에서 새로 저장된 논문 수',
      tone: '#4d8fcb',
    },
    {
      label: '중복 Skip',
      value: collectionSummary.skipped != null ? formatCompact(collectionSummary.skipped) : '—',
      caption: '최근 수집에서 중복으로 건너뛴 논문 수',
      tone: '#d9778b',
    },
    {
      label: '전체 저널',
      value: formatCompact(overview.totalJournals),
      caption: '저널 종류 기준',
      tone: '#8b6adc',
    },
  ];
  const journalChartHeight = Math.max(260, overview.journals.length * 42 + 24);

  const handleReset = async () => {
    const confirmed = window.confirm('내 수집 목록과 수집 이력을 초기화할까요? 공용 논문 메타데이터는 삭제되지 않습니다.');
    if (!confirmed) return;

    setClearing(true);
    setError('');
    setNotice('');
    try {
      await api.delete('/overview/records');
      setNotice('내 수집 목록과 수집 이력이 초기화되었습니다.');
      setCollectionSummary(emptyCollectionSummary);
      window.localStorage.removeItem(lastCollectionKey);
      window.dispatchEvent(new CustomEvent('pubmed-records-changed'));
      window.dispatchEvent(new CustomEvent('papers-collected'));
    } catch (err) {
      setError(err.message || '초기화에 실패했습니다.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <section className="page-content overview-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>연구 현황을 한눈에</h1>
          <p className="page-description">수집 직후의 결과와 전체 누적 현황을 함께 보여줍니다.</p>
        </div>
        <div className="overview-actions">
          <button className="button button-danger" type="button" onClick={handleReset} disabled={clearing}>
            {clearing ? '초기화 중…' : '저장 내용 초기화'}
          </button>
          {latestCollectedAt && (
            <div className="overview-badge clay-panel">
              <span>최근 수집</span>
              <strong>{formatDateTime(latestCollectedAt)}</strong>
            </div>
          )}
        </div>
      </div>

      {error && <div className="page-alert clay-panel">{error}</div>}
      {notice && <div className="page-notice clay-panel">{notice}</div>}

      <div className="stat-grid">
        {summaryCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="chart-grid">
        <article className="chart-card clay-panel">
          <div className="chart-header">
            <div>
              <h2>연도별 논문 수</h2>
              <p>연도 흐름을 부드러운 면적 그래프로 강조했습니다.</p>
            </div>
            <span className="chart-pill">{formatCompact(overview.byYear.reduce((sum, item) => sum + item.count, 0))}편</span>
          </div>
          <div className="chart-body">
            {loading ? (
              <div className="chart-empty">개요를 불러오는 중...</div>
            ) : overview.byYear.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={overview.byYear} margin={{ top: 10, right: 18, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="yearGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6f58c9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6f58c9" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e6dff0" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} dy={10} />
                  <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#8f6ce6', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={chartYears}
                    strokeWidth={3}
                    fill={chartYearFill}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">아직 연도별 데이터가 없습니다.</div>
            )}
          </div>
        </article>

        <article className="chart-card clay-panel">
          <div className="chart-header">
            <div>
              <h2>상위 저널</h2>
              <p>가장 많이 모인 저널을 충분한 간격과 줄임표로 정리했습니다.</p>
            </div>
            <span className="chart-pill">Top {overview.journals.length || 0}</span>
          </div>
          <div className="chart-body">
            {loading ? (
              <div className="chart-empty">개요를 불러오는 중...</div>
            ) : overview.journals.length ? (
              <ResponsiveContainer width="100%" height={journalChartHeight}>
                <BarChart data={overview.journals} layout="vertical" margin={{ top: 4, right: 24, left: 16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#e6dff0" />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={168}
                    tick={{ fontSize: 12, fill: '#6f6478' }}
                    tickFormatter={(value) => truncateLabel(value, 20)}
                  />
                  <Tooltip content={<NumberTooltip />} cursor={{ fill: 'rgba(111, 88, 201, 0.08)' }} />
                  <Bar dataKey="count" radius={[0, 14, 14, 0]} barSize={22}>
                    {overview.journals.map((entry, index) => (
                      <Cell key={entry.name} fill={journalPalette[index % journalPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">아직 저널 데이터가 없습니다.</div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
