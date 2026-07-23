import { Router } from 'express';
import { requireDatabase } from '../../lib/supabase.js';

export const overviewRouter = Router();

async function loadOverview(database, userId) {
  const [recordsResult, latestRunResult] = await Promise.all([
    database.from('pubmed_records').select('pub_year,journal').eq('collected_by', userId),
    database
      .from('collection_runs')
      .select('keyword,start_year,end_year,limit,found,inserted,skipped,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: papers, error } = recordsResult;
  if (error) throw error;
  const { data: latestRun, error: latestRunError } = latestRunResult;
  if (latestRunError) throw latestRunError;

  const normalizedPapers = papers || [];
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
    latestRun: normalizedPapers.length ? latestRun : null,
    byYear,
    journals,
  };
}

async function clearOverview(database, userId) {
  const [recordsResult, runsResult] = await Promise.all([
    database.from('pubmed_records').delete().eq('collected_by', userId).select('pmid'),
    database.from('collection_runs').delete().eq('user_id', userId).select('id'),
  ]);

  if (recordsResult.error) throw recordsResult.error;
  if (runsResult.error) throw runsResult.error;

  return {
    deletedRecords: recordsResult.data?.length || 0,
    deletedRuns: runsResult.data?.length || 0,
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
