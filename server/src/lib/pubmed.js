import { XMLParser } from 'fast-xml-parser';
import { env } from '../config/env.js';

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: true });

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value['#text'] || Object.values(value).map(text).join('');
  return String(value);
}

function articleIdInfo(articleId) {
  const type = String(articleId?.['@_IdType'] || articleId?.IdType || articleId?.['@_idtype'] || '').toLowerCase();
  const value = text(articleId).trim();
  return { type, value };
}

function normalizePmcid(value) {
  if (!value) return '';
  return value.toUpperCase().startsWith('PMC') ? value.toUpperCase() : `PMC${value}`;
}

export async function searchPmids({ keyword, startYear, endYear, limit, sortOrder = 'relevance' }) {
  const normalizedSortOrder = String(sortOrder || 'relevance').toLowerCase();
  const isDateSorted = normalizedSortOrder === 'newest' || normalizedSortOrder === 'oldest';
  const query = new URLSearchParams({
    db: 'pubmed',
    retmode: 'json',
    retmax: String(isDateSorted ? 10000 : limit),
    term: `${keyword} AND ${startYear}:${endYear}[pdat]`,
    ...(normalizedSortOrder === 'relevance' ? {} : { sort: isDateSorted ? 'pub_date' : normalizedSortOrder }),
    ...(env.ncbiApiKey ? { api_key: env.ncbiApiKey } : {}),
  });
  const response = await fetch(`${BASE_URL}/esearch.fcgi?${query}`);
  if (!response.ok) throw new Error('PubMed PMID 검색에 실패했습니다.');
  const data = await response.json();
  const idList = data.esearchresult?.idlist || [];

  if (normalizedSortOrder === 'oldest') {
    return idList.reverse().slice(0, limit);
  }

  return idList.slice(0, limit);
}

export async function fetchPaperMetadata(pmids) {
  if (!pmids.length) return [];
  const query = new URLSearchParams({
    db: 'pubmed',
    retmode: 'xml',
    id: pmids.join(','),
    ...(env.ncbiApiKey ? { api_key: env.ncbiApiKey } : {}),
  });
  const response = await fetch(`${BASE_URL}/efetch.fcgi?${query}`);
  if (!response.ok) throw new Error('PubMed 논문 메타데이터 조회에 실패했습니다.');
  const xml = parser.parse(await response.text());
  const articles = asArray(xml.PubmedArticleSet?.PubmedArticle);

  return articles.map((item) => {
    const citation = item.MedlineCitation || {};
    const article = citation.Article || {};
    const journalIssue = article.Journal?.JournalIssue || {};
    const authors = asArray(article.AuthorList?.Author)
      .map((author) => [text(author.ForeName), text(author.LastName)].filter(Boolean).join(' '))
      .filter(Boolean);
    const abstract = asArray(article.Abstract?.AbstractText).map(text).join('\n');
    const date = journalIssue.PubDate || {};
    const articleIds = asArray(item.PubmedData?.ArticleIdList?.ArticleId).map(articleIdInfo);
    const doi = articleIds.find((entry) => entry.type === 'doi')?.value || '';
    const pmcid = normalizePmcid(articleIds.find((entry) => entry.type === 'pmc' || entry.type === 'pmcid')?.value || '');

    return {
      pmid: text(citation.PMID),
      title: text(article.ArticleTitle),
      abstract,
      journal: text(article.Journal?.Title),
      pub_year: Number(text(date.Year) || text(date.MedlineDate).slice(0, 4)) || null,
      authors,
      doi,
      pmcid,
    };
  }).filter((paper) => paper.pmid);
}
