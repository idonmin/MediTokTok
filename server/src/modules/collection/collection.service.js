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

export function buildCollectionRecords(papers, insertedLinks) {
  const insertedPmids = new Set((insertedLinks || []).map((link) => link.pmid));
  return papers.map((paper) => ({
    ...paper,
    wasInserted: insertedPmids.has(paper.pmid),
  }));
}

export async function collectAndSavePapers(conditions, userId) {
  const database = requireDatabase();
  const pmids = await searchPmids(conditions);
  const papers = dedupeByPmid(await fetchPaperMetadata(pmids));
  if (!papers.length) return { found: 0, inserted: 0, skipped: 0, records: [] };

  const { error: metadataError } = await database
    .from('pubmed_records')
    .upsert(papers, { onConflict: 'pmid', ignoreDuplicates: true });
  if (metadataError) throw metadataError;

  const links = papers.map((paper) => ({ user_id: userId, pmid: paper.pmid }));
  const { data: insertedLinks, error: linkError } = await database
    .from('user_papers')
    .upsert(links, { onConflict: 'user_id,pmid', ignoreDuplicates: true })
    .select('pmid');
  if (linkError) throw linkError;

  const records = buildCollectionRecords(papers, insertedLinks);
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
