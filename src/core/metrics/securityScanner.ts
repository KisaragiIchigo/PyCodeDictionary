import { SecurityIssue, SupportedLanguage } from '../../types';

export function scanSecurityIssues(code: string, language: SupportedLanguage): SecurityIssue[] {
  const lines = code.split('\n');
  const issues: SecurityIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    // 1. ハードコードされたAPIキー / パスワード / 秘密鍵
    const secretMatch = trimmed.match(
      /(?:api[_-]?key|secret|password|passwd|auth[_-]?token|access[_-]?token|private[_-]?key)\s*[:=]\s*["']([A-Za-z0-9_\-.~+/=]{8,})["']/i
    );
    if (secretMatch && !secretMatch[1].startsWith('http') && !secretMatch[1].includes('${')) {
      issues.push({
        id: `sec-secret-${lineNum}`,
        line: lineNum,
        severity: 'critical',
        type: 'hardcoded-secret',
        message: `シークレット情報（APIキー/パスワード）がコード内に直接ハードコードされている可能性があります。`,
        snippet: trimmed,
        remediation: `環境変数（.env、os.environ.get、process.env）またはシークレットマネージャーから実行時に取得するように変更してください。`
      });
    }

    // 2. 危険な動的評価 (eval, exec, new Function, dangerouslySetInnerHTML)
    if (/\beval\s*\(/.test(trimmed) || /\bexec\s*\(/.test(trimmed)) {
      issues.push({
        id: `sec-eval-${lineNum}`,
        line: lineNum,
        severity: 'critical',
        type: 'unsafe-eval',
        message: `危険な動的コード実行関数（eval / exec）が検出されました。任意のコード実行脆弱性の原因となります。`,
        snippet: trimmed,
        remediation: `JSON.parse や ast.literal_eval、または静的なデータマッピング構造に置き換えてください。`
      });
    }

    if (/dangerouslySetInnerHTML/.test(trimmed)) {
      issues.push({
        id: `sec-xss-${lineNum}`,
        line: lineNum,
        severity: 'high',
        type: 'xss-vulnerability',
        message: `dangerouslySetInnerHTML の使用によるクロスサイトスクリプティング（XSS）の危険があります。`,
        snippet: trimmed,
        remediation: `DOMPurify などのサニタイズライブラリを通すか、通常の React 要素としてレンダリングしてください。`
      });
    }

    if (/pickle\.(?:loads?|Unpickler)/.test(trimmed)) {
      issues.push({
        id: `sec-pickle-${lineNum}`,
        line: lineNum,
        severity: 'high',
        type: 'insecure-deserialization',
        message: `信頼できないデータに対する pickle 逆シリアライズは、任意のコード実行を招く恐れがあります。`,
        snippet: trimmed,
        remediation: `JSON や Protocol Buffers などの安全なシリアライズ形式を使用してください。`
      });
    }

    // 3. SQLインジェクションの懸念（f文字列や文字列連結によるクエリ構築）
    if (
      /(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*?\s+(?:FROM|INTO|SET|WHERE)\s+.*?(?:f["']|\+\s*["']|\.format\()/i.test(
        trimmed
      )
    ) {
      issues.push({
        id: `sec-sql-${lineNum}`,
        line: lineNum,
        severity: 'high',
        type: 'sql-injection',
        message: `文字列連結や f-string による動的SQL構築が検出されました（SQLインジェクション脆弱性）。`,
        snippet: trimmed,
        remediation: `プレースホルダー（パラメタライズドクエリ: ?, %s, :param）またはORMを使用してください。`
      });
    }
  }

  return issues;
}
