import { useState } from "react";
import { collectPapers } from "./collection.api.js";

const initialForm = {
  keyword: "",
  startYear: "",
  endYear: "",
  limit: 20,
};

export function CollectionPanel() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const resetForm = () => {
    setForm({ ...initialForm });
    setStatus("");
    setRecords([]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setRecords([]);
    try {
      const result = await collectPapers({
        ...form,
        startYear: Number(form.startYear),
        endYear: Number(form.endYear),
        limit: Number(form.limit),
      });
      setStatus(
        `총 ${result.found}건 중 신규 ${result.inserted}건 · 중복 ${result.skipped}건`,
      );
      setRecords(result.records || []);
      window.dispatchEvent(
        new CustomEvent("papers-collected", { detail: result }),
      );
      window.dispatchEvent(
        new CustomEvent("pubmed-records-changed", { detail: result }),
      );
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="collection-form clay-panel" onSubmit={submit}>
      <h2>PubMed 검색 설정</h2>
      <label>
        키워드
        <input
          name="keyword"
          value={form.keyword}
          onChange={update}
          placeholder="예: COVID-19 vaccine"
          required
        />
      </label>
      <div className="field-row">
        <label>
          시작 연도
          <input
            name="startYear"
            type="number"
            min="1900"
            value={form.startYear}
            onChange={update}
            required
            placeholder="예: 2026"
          />
        </label>
        <label>
          끝 연도
          <input
            name="endYear"
            type="number"
            min="1900"
            value={form.endYear}
            onChange={update}
            required
            placeholder="예: 2026"
          />
        </label>
      </div>
      <div className="range-field">
        <div className="range-head">
          <span>최대 수집 논문 수</span>
          <output>{form.limit}개</output>
        </div>
        <input
          name="limit"
          className="range-input"
          type="range"
          min="1"
          max="100"
          value={form.limit}
          onChange={update}
        />
        <div className="range-scale">
          <span>1개</span>
          <span>100개</span>
        </div>
      </div>
      <div className="collection-actions">
        <button
          className="button button-ghost"
          type="button"
          onClick={resetForm}
          disabled={loading}
        >
          초기화
        </button>
        <button className="button button-primary" disabled={loading}>
          {loading ? "수집 중…" : "PubMed 수집"}
        </button>
      </div>
      {status && <p className="form-status">{status}</p>}
      {records.length > 0 && (
        <section className="collection-result">
          <div className="collection-result-header">
            <strong>수집된 실제 논문</strong>
            <span>{records.length}건</span>
          </div>
          <ul className="collection-record-list">
            {records.slice(0, 5).map((record) => (
              <li key={record.pmid} className="collection-record-item">
                <div className="record-topline">
                  <span
                    className={record.wasInserted ? "record-badge new" : "record-badge existing"}
                  >
                    {record.wasInserted ? "내 목록에 추가됨" : "이미 내 목록에 있음"}
                  </span>
                  <span className="record-pmid">PMID {record.pmid}</span>
                </div>
                <strong className="record-title">{record.title}</strong>
                <p className="record-meta">
                  {record.journal || "저널 정보 없음"} ·{" "}
                  {record.pub_year || "연도 정보 없음"}
                </p>
                <p className="record-authors">
                  {record.authors?.length
                    ? record.authors.join(", ")
                    : "저자 정보 없음"}
                </p>
              </li>
            ))}
          </ul>
          {records.length > 5 && (
            <p className="collection-more">처음 5건만 표시했습니다.</p>
          )}
        </section>
      )}
    </form>
  );
}
