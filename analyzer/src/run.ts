import { buildComment, buildFailureNotice, countFailures } from './analysis.js';
import { callLlm as defaultCallLlm, LlmError } from './llm.js';
import { prepareDiff, prepareInput } from './processing.js';

const REASONS: Record<string, string> = {
  auth: 'API 키 오류',
  rate_limit: '호출 한도 초과',
  upstream: 'AI 서비스 오류',
  timeout: '응답 시간 초과',
  invalid: 'AI 응답 형식 오류',
};

const FAILED_TITLE = 'CI 실패 (자동 분석 못 함)';

export interface AnalyzeInput {
  log: string;
  report?: string;
  diff?: string;
  sha: string;
  branch: string;
  event: string;
  runUrl: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface AnalyzeResult {
  title: string;
  comment: string;
  fingerprint: string;
  ok: boolean;
}

/** 서버 없이 한 번에: 정리, 비밀값 가리기, AI 호출, 댓글 글 만들기 */
export async function analyze(
  input: AnalyzeInput,
  deps: { callLlm: typeof defaultCallLlm } = { callLlm: defaultCallLlm },
): Promise<AnalyzeResult> {
  // 외부로 나가기 전에 정리하고 비밀값을 가린다
  const prepared = prepareInput(input.log, input.report);
  const { errorSection, failedTests, fingerprint } = prepared;
  const diff = prepareDiff(input.diff);

  try {
    if (!input.apiKey || !input.model)
      throw new LlmError('auth', 'OPENROUTER_API_KEY 또는 LLM_MODEL이 없습니다');
    const llm = await deps.callLlm({
      apiKey: input.apiKey,
      model: input.model,
      failedTests,
      errorSection,
      diff: diff.text || undefined,
      baseUrl: input.baseUrl,
    });
    return {
      title: llm.title,
      comment: buildComment({
        llm,
        model: input.model,
        sha: input.sha,
        branch: input.branch,
        event: input.event,
        runUrl: input.runUrl,
        fingerprint,
        maskedCount: prepared.maskedCount,
        failedTests,
        errorSection,
        diffChars: diff.text.length || undefined,
      }),
      fingerprint,
      ok: true,
    };
  } catch (e) {
    const code = e instanceof LlmError ? e.code : 'upstream';
    return {
      title: FAILED_TITLE,
      comment: buildFailureNotice({
        reason: REASONS[code] ?? 'AI 서비스 오류',
        runUrl: input.runUrl,
      }),
      fingerprint,
      ok: false,
    };
  }
}

export { countFailures };
