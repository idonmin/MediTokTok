import { useState } from 'react';
import { collectPapers } from './collection.api.js';

const initialForm = { keyword: 'COVID-19 vaccine', startYear: 2022, endYear: 2025, limit: 20 };

export function CollectionPanel() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const resetForm = () => {
    setForm({ ...initialForm });
    setStatus('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const result = await collectPapers({
        ...form,
        startYear: Number(form.startYear),
        endYear: Number(form.endYear),
        limit: Number(form.limit),
      });
      setStatus(`총 ${result.found}건 중 신규 ${result.inserted}건 · 중복 ${result.skipped}건`);
      window.dispatchEvent(new CustomEvent('papers-collected', { detail: result }));
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="collection-form clay-panel" onSubmit={submit}>
      <h2>PubMed 검색 설정</h2>
      <label>키워드<input name="keyword" value={form.keyword} onChange={update} required /></label>
      <div className="field-row">
        <label>시작 연도<input name="startYear" type="number" min="1900" value={form.startYear} onChange={update} required /></label>
        <label>끝 연도<input name="endYear" type="number" min="1900" value={form.endYear} onChange={update} required /></label>
      </div>
      <div className="range-field">
        <div className="range-head">
          <span>최대 수집 논문 수</span>
          <output>{form.limit}개</output>
        </div>
        <input name="limit" className="range-input" type="range" min="1" max="100" value={form.limit} onChange={update} />
        <div className="range-scale"><span>1개</span><span>100개</span></div>
      </div>
      <div className="collection-actions">
        <button className="button button-ghost" type="button" onClick={resetForm} disabled={loading}>초기화</button>
        <button className="button button-primary" disabled={loading}>{loading ? '수집 중…' : 'PubMed 수집'}</button>
      </div>
      {status && <p className="form-status">{status}</p>}
    </form>
  );
}
