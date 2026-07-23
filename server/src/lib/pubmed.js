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

export async function searchPmids({ keyword, startYear, endYear, limit }) {
  const query = new URLSearchParams({
    db: 'pubmed',
    retmode: 'json',
    retmax: String(limit),
    term: `${keyword} AND ${startYear}:${endYear}[pdat]`,
    ...(env.ncbiApiKey ? { api_key: env.ncbiApiKey } : {}),
  });
  const response = await fetch(`${BASE_URL}/esearch.fcgi?${query}`);
  if (!response.ok) throw new Error('PubMed PMID 검색에 실패했습니다.');
  const data = await response.json();
  return data.esearchresult?.idlist || [];
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
    const authors = asArray(article.AuthorList?.Author).map((author) =>
      [text(author.ForeName), text(author.LastName)].filter(Boolean).join(' '),
    ).filter(Boolean);
    const abstract = asArray(article.Abstract?.AbstractText).map(text).join('\n');
    const date = journalIssue.PubDate || {};

    return {
      pmid: text(citation.PMID),
      title: text(article.ArticleTitle),
      abstract,
      journal: text(article.Journal?.Title),
      pub_year: Number(text(date.Year) || text(date.MedlineDate).slice(0, 4)) || null,
      authors,
    };
  }).filter((paper) => paper.pmid);
}
