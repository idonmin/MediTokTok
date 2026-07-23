import { useState } from 'react';
import { collectPapers } from './collection.api.js';

const initialForm = { keyword: 'COVID-19 vaccine', startYear: 2022, endYear: 2025, limit: 20 };

export function CollectionPanel() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

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
      setStatus(`신규 ${result.inserted}건 · 중복 ${result.skipped}건`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="collection-form" onSubmit={submit}>
      <h2>PubMed 검색 설정</h2>
      <label>키워드<input name="keyword" value={form.keyword} onChange={update} required /></label>
      <div className="field-row">
        <label>시작 연도<input name="startYear" type="number" min="1900" value={form.startYear} onChange={update} required /></label>
        <label>끝 연도<input name="endYear" type="number" min="1900" value={form.endYear} onChange={update} required /></label>
      </div>
      <label>최대 수집 논문 수<input name="limit" type="range" min="1" max="100" value={form.limit} onChange={update} /><output>{form.limit}개</output></label>
      <button className="button button-primary" disabled={loading}>{loading ? '수집 중…' : 'PubMed 수집'}</button>
      {status && <p className="form-status">{status}</p>}
    </form>
  );
}
