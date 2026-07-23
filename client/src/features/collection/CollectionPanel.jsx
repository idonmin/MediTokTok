import { useState } from "react";
import { collectPapers } from "./collection.api.js";

const initialForm = {
  keyword: "",
  startYear: 2022,
  endYear: 2025,
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
      setStatus(`신규 ${result.inserted}건 · 중복 ${result.skipped}건`);
      setRecords(result.records || []);
      window.dispatchEvent(new CustomEvent('pubmed-records-changed'));
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="collection-form" onSubmit={submit}>
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
          />
        </label>
      </div>
      <label>
        최대 수집 논문 수
        <input
          name="limit"
          type="range"
          min="1"
          max="100"
          value={form.limit}
          onChange={update}
        />
        <output>{form.limit}개</output>
      </label>
      <button className="button button-primary" disabled={loading}>
        {loading ? "수집 중…" : "PubMed 수집"}
      </button>
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
                  <span className={record.wasInserted ? "record-badge new" : "record-badge existing"}>
                    {record.wasInserted ? "새로 저장됨" : "이미 저장됨"}
                  </span>
                  <span className="record-pmid">PMID {record.pmid}</span>
                </div>
                <strong className="record-title">{record.title}</strong>
                <p className="record-meta">
                  {record.journal || "저널 정보 없음"} · {record.pub_year || "연도 정보 없음"}
                </p>
                <p className="record-authors">
                  {record.authors?.length ? record.authors.join(', ') : '저자 정보 없음'}
                </p>
              </li>
            ))}
          </ul>
          {records.length > 5 && <p className="collection-more">처음 5건만 표시했습니다.</p>}
        </section>
      )}
    </form>
  );
}
