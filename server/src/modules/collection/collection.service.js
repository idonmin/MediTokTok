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

export function buildCollectionRecords(papers, insertedCollections) {
  const insertedPmids = new Set((insertedCollections || []).map((record) =>
    typeof record === 'string' ? record : record.pmid,
  ));
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
    .upsert(papers.map(({
      pmid, title, abstract, journal, pub_year, authors,
    }) => ({
      pmid, title, abstract, journal, pub_year, authors,
    })), { onConflict: 'pmid', ignoreDuplicates: true });
  if (metadataError) throw metadataError;

  const { data: insertedCollections, error: collectionError } = await database
    .from('user_paper_collections')
    .upsert(
      papers.map((paper) => ({ user_id: userId, pmid: paper.pmid })),
      { onConflict: 'user_id,pmid', ignoreDuplicates: true },
    )
    .select('pmid');
  if (collectionError) throw collectionError;

  const records = buildCollectionRecords(papers, insertedCollections);
  const inserted = records.filter((paper) => paper.wasInserted).length;
  const result = {
    found: papers.length,
    inserted,
    skipped: papers.length - inserted,
  };
  return { ...result, records };
}
