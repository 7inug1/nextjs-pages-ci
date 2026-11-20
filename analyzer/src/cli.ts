import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { analyze } from './run.js';
import { prepareInput } from './processing.js';

const read = (path: string | undefined) =>
  path && existsSync(path) ? readFileSync(path, 'utf-8') : undefined;

const [command, logPath = 'log.txt', reportPath = 'report.xml', diffPath = 'diff.txt'] =
  process.argv.slice(2);

async function main(): Promise<void> {
  const log = read(logPath);
  if (!log) {
    console.error(`${logPath} 파일이 필요합니다`);
    process.exit(1);
  }
  
  if (command === 'fingerprint') {
    // 지문만 계산한다 (AI를 부르지 않음). 같은 실패의 이슈가 이미 있는지 확인할 때 쓴다.
    process.stdout.write(prepareInput(log, read(reportPath)).fingerprint);
  } else if (command === 'analyze') {
    const env = process.env;
    const result = await analyze({
      log,
      report: read(reportPath),
      diff: read(diffPath),
      sha: env.SHA ?? 'unknown',
      branch: env.BRANCH ?? 'unknown',
      event: env.EVENT ?? 'unknown',
      runUrl: env.RUN_URL ?? '',
      apiKey: env.OPENROUTER_API_KEY,
      model: env.LLM_MODEL,
      baseUrl: env.OPENROUTER_BASE_URL || undefined,
    });
    writeFileSync('comment.md', result.comment);
    writeFileSync('title.txt', result.title);
    console.log(`분석 ${result.ok ? '성공' : '실패'}: 지문 ${result.fingerprint}`);
  } else {
    console.error('사용법: cli.ts fingerprint|analyze [log] [report] [diff]');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
