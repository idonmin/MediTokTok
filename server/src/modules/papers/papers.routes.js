import { Router } from 'express';
import { requireDatabase } from '../../lib/supabase.js';

export const papersRouter = Router();

function applyFilters(query, params) {
  let filtered = query;
  const searchMode = String(params.searchMode || (params.pmid ? 'pmid' : 'text')).toLowerCase();
  const searchTerm = String(params.searchTerm || params.query || params.pmid || '').trim();

  if (searchTerm) {
    if (searchMode === 'pmid') {
      filtered = filtered.eq('pubmed_records.pmid', searchTerm);
    } else {
      filtered = filtered.or(
        `title.ilike.%${searchTerm}%,abstract.ilike.%${searchTerm}%`,
        { referencedTable: 'pubmed_records' },
      );
    }
  }

  if (params.startYear) filtered = filtered.gte('pubmed_records.pub_year', Number(params.startYear));
  if (params.endYear) filtered = filtered.lte('pubmed_records.pub_year', Number(params.endYear));
  if (params.journal) filtered = filtered.ilike('pubmed_records.journal', `%${params.journal}%`);
  return filtered;
}

function flattenCollections(collections) {
  return (collections || [])
    .map((collection) => ({
      ...collection.pubmed_records,
      collected_at: collection.collected_at,
    }))
    .filter((paper) => paper.pmid);
}

papersRouter.get('/', async (req, res, next) => {
  try {
    const database = requireDatabase();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
    let query = database
      .from('user_paper_collections')
      .select('collected_at,pubmed_records!inner(pmid,pub_year,title,abstract,journal,authors)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('pub_year', { referencedTable: 'pubmed_records', ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    query = applyFilters(query, req.query);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ items: flattenCollections(data), total: count || 0, page, pageSize });
  } catch (error) {
    next(error);
  }
});

papersRouter.get('/export', async (req, res, next) => {
  try {
    const database = requireDatabase();
    let query = database
      .from('user_paper_collections')
      .select('collected_at,pubmed_records!inner(pmid,pub_year,title,abstract,journal,authors)')
      .eq('user_id', req.user.id);
    query = applyFilters(query, req.query);
    const { data, error } = await query;
    if (error) throw error;
    const columns = ['pmid', 'pub_year', 'title', 'journal', 'authors', 'collected_at'];
    const escape = (value) => `"${String(Array.isArray(value) ? value.join('; ') : value ?? '').replaceAll('"', '""')}"`;
    const csv = [
      columns.join(','),
      ...flattenCollections(data).map((row) => columns.map((column) => escape(row[column])).join(',')),
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="meditalktalk-papers.csv"');
    res.send(`﻿${csv}`);
  } catch (error) {
    next(error);
  }
});
