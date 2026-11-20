import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LlmError, type LlmAnalysis } from './llm.js';
import { analyze } from './run.js';

const LOG = 'FAIL __tests__/page.test.tsx\nAssertionError: expected 1 to be 2\n';
const meta = {
  sha: 'abcdef1234567',
  branch: 'main',
  event: 'push',
  runUrl: 'https://example.com/run/1',
};
const llmResult: LlmAnalysis = {
  title: '첫 화면 테스트 실패',
  summary: '요약',
  category: 'test',
  severity: 'medium',
  suspected_cause: '원인',
  related_files: ['app/page.tsx'],
  suggested_fix: '수정',
  next_checks: ['확인'],
  confidence: 0.8,
};

test('AI가 답하면 제목과 댓글 글과 지문을 돌려준다', async () => {
  const r = await analyze(
    { log: LOG, ...meta, apiKey: 'k', model: 'm' },
    { callLlm: async () => llmResult },
  );
  assert.equal(r.title, '첫 화면 테스트 실패');
  assert.match(r.comment, /첫 화면 테스트 실패|요약/);
  assert.match(r.fingerprint, /^[0-9a-f]{12}$/);
  assert.equal(r.ok, true);
});

test('AI 호출이 실패하면 지어내지 않고 사유와 링크만 남긴다', async () => {
  const r = await analyze(
    { log: LOG, ...meta, apiKey: 'k', model: 'm' },
    {
      callLlm: async () => {
        throw new LlmError('rate_limit', '429');
      },
    },
  );
  assert.equal(r.ok, false);
  assert.match(r.comment, /호출 한도 초과/);
  assert.match(r.comment, /https:\/\/example\.com\/run\/1/);
  assert.equal(r.title, 'CI 실패 (자동 분석 못 함)');
});

test('키나 모델이 없으면 AI를 부르지 않고 키 오류로 알린다', async () => {
  let called = false;
  const r = await analyze(
    { log: LOG, ...meta },
    {
      callLlm: async () => {
        called = true;
        return llmResult;
      },
    },
  );
  assert.equal(called, false);
  assert.equal(r.ok, false);
  assert.match(r.comment, /API 키 오류/);
});

test('로그의 비밀값은 AI에 보내기 전에 가린다', async () => {
  let sent = '';
  await analyze(
    {
      log: `${LOG}token=ghp_${'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8'}\n`,
      ...meta,
      apiKey: 'k',
      model: 'm',
    },
    {
      callLlm: async (i) => {
        sent = i.errorSection;
        return llmResult;
      },
    },
  );
  assert.doesNotMatch(sent, /ghp_a1B2/);
});
