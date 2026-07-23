import { requireDatabase } from '../../lib/supabase.js';
import { fetchPaperMetadata, searchPmids } from '../../lib/pubmed.js';

function dedupeByPmid(papers) {
  const seen = new Set();
  return papers.filter((paper) => {
    if (!paper.pmid || seen.has(paper.pmid)) return false;
    seen.add(paper.pmid);
    return true;
  });
}

export async function collectAndSavePapers(conditions, userId) {
  const database = requireDatabase();
  const pmids = await searchPmids(conditions);
  const papers = dedupeByPmid(await fetchPaperMetadata(pmids));
  if (!papers.length) return { found: 0, inserted: 0, skipped: 0, records: [] };

  const { data: existing, error: selectError } = await database
    .from('pubmed_records')
    .select('pmid')
    .in('pmid', papers.map((paper) => paper.pmid));
  if (selectError) throw selectError;

  const existingPmids = new Set((existing || []).map((paper) => paper.pmid));
  const records = papers.map((paper) => ({
    ...paper,
    wasInserted: !existingPmids.has(paper.pmid),
  }));
  const newPapers = records
    .filter((paper) => paper.wasInserted)
    .map(({ wasInserted, ...paper }) => ({ ...paper, collected_by: userId }));

  if (newPapers.length) {
    const { error: insertError } = await database
      .from('pubmed_records')
      .upsert(newPapers, { onConflict: 'pmid', ignoreDuplicates: true });
    if (insertError) throw insertError;
  }

  const result = { found: papers.length, inserted: newPapers.length, skipped: papers.length - newPapers.length };
  await database.from('collection_runs').insert({
    user_id: userId,
    keyword: conditions.keyword,
    start_year: conditions.startYear,
    end_year: conditions.endYear,
    limit: conditions.limit,
    ...result,
  });
  return { ...result, records };
}
