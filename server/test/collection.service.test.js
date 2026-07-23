import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCollectionRecords, dedupeByPmid } from '../src/modules/collection/collection.service.js';

test('PubMed 응답에서 중복 PMID를 한 번만 유지한다', () => {
  const papers = [
    { pmid: '100', title: 'first' },
    { pmid: '100', title: 'duplicate' },
    { pmid: '200', title: 'second' },
    { pmid: '', title: 'invalid' },
  ];

  assert.deepEqual(dedupeByPmid(papers), [
    { pmid: '100', title: 'first' },
    { pmid: '200', title: 'second' },
  ]);
});

test('사용자 컬렉션에 실제 추가된 링크만 신규로 표시한다', () => {
  const papers = [
    { pmid: '100', title: 'already collected' },
    { pmid: '200', title: 'new collection' },
  ];

  assert.deepEqual(buildCollectionRecords(papers, [{ pmid: '200' }]), [
    { pmid: '100', title: 'already collected', wasInserted: false },
    { pmid: '200', title: 'new collection', wasInserted: true },
  ]);
});
