import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const yearlyData = [{ year: '2022', count: 14 }, { year: '2023', count: 31 }, { year: '2024', count: 42 }, { year: '2025', count: 27 }];
const journalData = [{ name: 'Vaccine', count: 18 }, { name: 'Lancet', count: 13 }, { name: 'Nature', count: 9 }, { name: 'BMJ', count: 7 }];

export function OverviewPage() {
  return (
    <section className="page-content">
      <div className="page-heading"><div><span className="eyebrow">OVERVIEW</span><h1>연구 현황을 한눈에</h1></div></div>
      <div className="stat-grid">
        {[['전체 논문', '114'], ['신규 수집', '20'], ['중복 Skip', '3'], ['전체 저널', '42']].map(([label, value]) => (
          <article className="stat-card clay-panel" key={label}><span>{label}</span><strong>{value}</strong></article>
        ))}
      </div>
      <div className="chart-grid">
        <article className="chart-card clay-panel"><h2>연도별 논문 수</h2><ResponsiveContainer width="100%" height={260}><BarChart data={yearlyData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#6750a4" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></article>
        <article className="chart-card clay-panel"><h2>상위 저널</h2><ResponsiveContainer width="100%" height={260}><BarChart data={journalData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis type="category" dataKey="name" width={70} /><Tooltip /><Bar dataKey="count" fill="#e66888" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer></article>
      </div>
      <p className="demo-note">현재 차트는 UI 개발용 예시 데이터입니다. 담당자는 `/api/overview` 응답으로 교체하세요.</p>
    </section>
  );
}
