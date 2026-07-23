export function PaperFilters({ filters, onChange, onSubmit }) {
  const update = (event) =>
    onChange({ ...filters, [event.target.name]: event.target.value });
  const searchLabel =
    filters.searchMode === "pmid" ? "PMID" : "제목/Abstract 검색";
  const searchPlaceholder =
    filters.searchMode === "pmid" ? "예: 41454846" : "예: vaccine";

  return (
    <form className="filter-panel clay-panel" onSubmit={onSubmit}>
      <div className="filter-grid">
        <label>
          검색 방식
          <select
            name="searchMode"
            value={filters.searchMode}
            onChange={update}
          >
            <option value="pmid">PMID</option>
            <option value="text">제목/Abstract</option>
          </select>
        </label>
        <label>
          {searchLabel}
          <input
            name="searchTerm"
            value={filters.searchTerm}
            onChange={update}
            placeholder={searchPlaceholder}
            required
            autoComplete="off"
          />
        </label>
        <label>
          시작 연도
          <input
            name="startYear"
            type="number"
            value={filters.startYear}
            onChange={update}
            placeholder="예: 2020"
          />
        </label>
        <label>
          끝 연도
          <input
            name="endYear"
            type="number"
            value={filters.endYear}
            onChange={update}
            placeholder="예: 2026"
          />
        </label>
        <label>
          저널
          <input
            name="journal"
            value={filters.journal}
            onChange={update}
            placeholder="예: Vaccine"
          />
        </label>
      </div>
      <button className="button button-primary filter-submit" type="submit">
        검색하기
      </button>
    </form>
  );
}
