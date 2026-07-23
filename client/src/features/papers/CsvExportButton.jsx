import { api } from '../../lib/api.js';

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value).trim());
    }
  });
  return params.toString();
}

export function CsvExportButton({ filters }) {
  const download = async () => {
    const query = buildQuery(filters);
    const blob = await api.download(`/papers/export${query ? `?${query}` : ''}`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'meditalktalk-papers.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="button button-ghost" type="button" onClick={download}>
      CSV 다운로드
    </button>
  );
}
