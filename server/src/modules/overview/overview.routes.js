import { Router } from 'express';
import { requireDatabase } from '../../lib/supabase.js';

export const overviewRouter = Router();

async function loadOverview(database, userId) {
  const recordsResult = await database
    .from('user_paper_collections')
    .select('collected_at,pubmed_records!inner(pub_year,journal)')
    .eq('user_id', userId)
    .order('collected_at', { ascending: false });

  const { data: collections, error } = recordsResult;
  if (error) throw error;

  const normalizedCollections = collections || [];
  const normalizedPapers = normalizedCollections
    .map((collection) => collection.pubmed_records)
    .filter(Boolean);
  const yearlyCounts = normalizedPapers.reduce((acc, paper) => {
    const year = String(paper.pub_year || '').trim();
    if (!year) return acc;
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});
  const journalCounts = normalizedPapers.reduce((acc, paper) => {
    const journal = String(paper.journal || '').trim();
    if (!journal) return acc;
    acc[journal] = (acc[journal] || 0) + 1;
    return acc;
  }, {});

  const byYear = Object.entries(yearlyCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => Number(a.year) - Number(b.year));
  const journals = Object.entries(journalCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 8);

  return {
    totalPapers: normalizedPapers.length,
    totalJournals: Object.keys(journalCounts).length,
    latestCollectedAt: normalizedCollections[0]?.collected_at || null,
    byYear,
    journals,
  };
}

async function clearOverview(database, userId) {
  const { data: currentCollections, error: collectionsError } = await database
    .from('user_paper_collections')
    .select('pmid')
    .eq('user_id', userId);
  if (collectionsError) throw collectionsError;

  const pmids = [...new Set((currentCollections || []).map((collection) => collection.pmid).filter(Boolean))];
  const { data, error } = await database
    .from('user_paper_collections')
    .delete()
    .eq('user_id', userId)
    .select('pmid');
  if (error) throw error;

  if (pmids.length) {
    const { data: remainingCollections, error: remainingError } = await database
      .from('user_paper_collections')
      .select('pmid')
      .in('pmid', pmids);
    if (remainingError) throw remainingError;

    const stillCollected = new Set((remainingCollections || []).map((collection) => collection.pmid));
    const pmidsToReset = pmids.filter((pmid) => !stillCollected.has(pmid));

    if (pmidsToReset.length) {
      const { error: resetError } = await database
        .from('pubmed_records')
        .update({ status: 0 })
        .in('pmid', pmidsToReset);
      if (resetError) throw resetError;
    }
  }

  return {
    deletedCollections: data?.length || 0,
  };
}

overviewRouter.get('/', async (req, res, next) => {
  try {
    const database = requireDatabase();
    const overview = await loadOverview(database, req.user.id);
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

overviewRouter.delete('/records', async (req, res, next) => {
  try {
    const database = requireDatabase();
    const result = await clearOverview(database, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

overviewRouter.post('/reset', async (req, res, next) => {
  try {
    const database = requireDatabase();
    const result = await clearOverview(database, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
