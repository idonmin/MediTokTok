import { requireDatabase } from '../../lib/supabase.js';
import { fetchPaperMetadata, searchPmids } from '../../lib/pubmed.js';

export async function collectAndSavePapers(conditions, userId) {
  const database = requireDatabase();
  const pmids = await searchPmids(conditions);
  const papers = await fetchPaperMetadata(pmids);
  if (!papers.length) return { found: 0, inserted: 0, skipped: 0 };

  const { data: existing, error: selectError } = await database.from('papers').select('pmid').in('pmid', papers.map((paper) => paper.pmid));
  if (selectError) throw selectError;
  const existingPmids = new Set((existing || []).map((paper) => paper.pmid));
  const newPapers = papers.filter((paper) => !existingPmids.has(paper.pmid)).map((paper) => ({ ...paper, collected_by: userId }));

  if (newPapers.length) {
    const { error: insertError } = await database.from('papers').insert(newPapers);
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
  return result;
}
