import { requireDatabase } from '../../lib/supabase.js';
import { fetchPaperMetadata, searchPmids } from '../../lib/pubmed.js';

export function dedupeByPmid(papers) {
  const seen = new Set();
  return papers.filter((paper) => {
    if (!paper.pmid || seen.has(paper.pmid)) return false;
    seen.add(paper.pmid);
    return true;
  });
}

export function buildCollectionRecords(papers, existingPmids) {
  const seenPmids = new Set(existingPmids || []);
  return papers.map((paper) => ({
    ...paper,
    wasInserted: !seenPmids.has(paper.pmid),
  }));
}

export async function collectAndSavePapers(conditions, userId) {
  const database = requireDatabase();
  const pmids = await searchPmids(conditions);
  const papers = dedupeByPmid(await fetchPaperMetadata(pmids));
  if (!papers.length) return { found: 0, inserted: 0, skipped: 0, records: [] };

  const { data: existingRecords, error: existingError } = await database
    .from('pubmed_records')
    .select('pmid')
    .eq('user_id', userId)
    .in('pmid', papers.map((paper) => paper.pmid));
  if (existingError) throw existingError;

  const recordsToSave = papers.map((paper) => ({ ...paper, user_id: userId }));
  const { error: metadataError } = await database
    .from('pubmed_records')
    .upsert(recordsToSave, { onConflict: 'user_id,pmid', ignoreDuplicates: true });
  if (metadataError) throw metadataError;

  const existingPmids = (existingRecords || []).map((record) => record.pmid);
  const records = buildCollectionRecords(papers, existingPmids);
  const inserted = records.filter((paper) => paper.wasInserted).length;
  const result = {
    found: papers.length,
    inserted,
    skipped: papers.length - inserted,
  };
  const { error: runError } = await database.from('collection_runs').insert({
    user_id: userId,
    keyword: conditions.keyword,
    start_year: conditions.startYear,
    end_year: conditions.endYear,
    limit: conditions.limit,
    ...result,
  });
  if (runError) throw runError;
  return { ...result, records };
}
