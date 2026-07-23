import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api.js';

const emptyOverview = {
  totalPapers: 0,
  totalJournals: 0,
  byYear: [],
  journals: [],
};

function truncateLabel(value, maxLength) {
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function OverviewPage() {
  const [overview, setOverview] = useState(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const yearChartHeight = Math.max(260, overview.byYear.length * 34 + 80);
  const journalChartHeight = Math.max(260, overview.journals.length * 40 + 70);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get('/overview');
        if (!active) return;
        setOverview({
          totalPapers: data.totalPapers ?? 0,
          totalJournals: data.totalJournals ?? 0,
          byYear: data.byYear ?? [],
          journals: data.journals ?? [],
        });
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOverview();

    return () => {
      active = false;
    };
  }, []);

  const stats = [
    ['전체 논문', overview.totalPapers],
    ['전체 저널', overview.totalJournals],
    ['연도 집계', overview.byYear.length],
    ['상위 저널', overview.journals.length],
  ];

  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>연구 현황을 한눈에</h1>
        </div>
      </div>
      {loading && <p className="demo-note">실제 `/api/overview` 데이터를 불러오는 중입니다.</p>}
      {error && <p className="demo-note">{error}</p>}
      <div className="stat-grid">
        {stats.map(([label, value]) => (
          <article className="stat-card clay-panel" key={label}>
            <span>{label}</span>
            <strong>{loading ? '...' : value}</strong>
          </article>
        ))}
      </div>
      <div className="chart-grid">
        <article className="chart-card clay-panel">
          <h2>연도별 논문 수</h2>
          <ResponsiveContainer width="100%" height={yearChartHeight}>
            <BarChart data={overview.byYear} margin={{ top: 12, right: 16, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="year"
                interval="preserveStartEnd"
                tickMargin={10}
                tick={{ fontSize: 12 }}
              />
              <YAxis allowDecimals={false} tickMargin={8} tick={{ fontSize: 12 }} width={34} />
              <Tooltip />
              <Bar dataKey="count" fill="#6750a4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="chart-card clay-panel">
          <h2>상위 저널</h2>
          <ResponsiveContainer width="100%" height={journalChartHeight}>
            <BarChart
              data={overview.journals}
              layout="vertical"
              margin={{ top: 8, right: 18, left: 6, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickMargin={8} tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => truncateLabel(value, 16)}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#e66888" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </div>
      {!loading && !error && overview.totalPapers === 0 && (
        <p className="demo-note">아직 수집된 논문이 없어 차트가 비어 있습니다. 먼저 PubMed 수집을 실행해 주세요.</p>
      )}
    </section>
  );
}
