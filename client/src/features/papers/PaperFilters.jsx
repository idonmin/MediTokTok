export function PaperFilters({ filters, onChange, onSubmit }) {
  const update = (event) => onChange({ ...filters, [event.target.name]: event.target.value });
  return (
    <form className="filter-panel clay-panel" onSubmit={onSubmit}>
      <label>제목/Abstract 검색<input name="query" value={filters.query} onChange={update} placeholder="예: vaccine" /></label>
      <label>시작 연도<input name="startYear" type="number" value={filters.startYear} onChange={update} /></label>
      <label>끝 연도<input name="endYear" type="number" value={filters.endYear} onChange={update} /></label>
      <label>저널<select name="journal" value={filters.journal} onChange={update}><option value="">전체</option><option>Vaccine</option><option>The Lancet</option></select></label>
      <button className="button button-primary">검색</button>
    </form>
  );
}
