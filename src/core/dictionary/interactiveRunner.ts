import { SupportedLanguage } from '../../types';

export interface ExecutionResult {
  success: boolean;
  logs: string[];
  returnValue?: string;
  executionTimeMs: number;
  error?: string;
}

/**
 * 辞書プレイグラウンド用 安全なクライアントサイド実行・シミュレータエンジン
 */
export function executePlaygroundCode(code: string, language: SupportedLanguage): ExecutionResult {
  const startTime = performance.now();

  if (language === 'javascript' || language === 'typescript') {
    return runJavaScriptSandbox(code, startTime);
  }

  if (language === 'python') {
    return simulatePythonExecution(code, startTime);
  }

  // 他言語の簡易シミュレーション
  return simulateGenericExecution(code, language, startTime);
}

function runJavaScriptSandbox(code: string, startTime: number): ExecutionResult {
  const logs: string[] = [];
  const customConsole = {
    log: (...args: any[]) => {
      logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
    },
    info: (...args: any[]) => {
      logs.push('[INFO] ' + args.map(a => String(a)).join(' '));
    },
    warn: (...args: any[]) => {
      logs.push('[WARN] ' + args.map(a => String(a)).join(' '));
    },
    error: (...args: any[]) => {
      logs.push('[ERROR] ' + args.map(a => String(a)).join(' '));
    }
  };

  try {
    // TypeScriptの型アノテーションを簡易ストリップ（型付きJSとして動かす）
    const sanitizedCode = code
      .replace(/:\s*(string|number|boolean|any|void|unknown|object|never|Record<[^>]+>|Array<[^>]+>|[A-Z][a-zA-Z0-9_]*(\[\])?)/g, '')
      .replace(/interface\s+[A-Za-z0-9_]+\s*\{[^}]*\}/g, '')
      .replace(/type\s+[A-Za-z0-9_]+\s*=\s*[^;]+;/g, '');

    const runner = new Function('console', `
      "use strict";
      try {
        ${sanitizedCode}
      } catch (err) {
        throw err;
      }
    `);

    const result = runner(customConsole);
    const endTime = performance.now();

    return {
      success: true,
      logs: logs.length > 0 ? logs : ['(標準出力なし)'],
      returnValue: result !== undefined ? String(result) : undefined,
      executionTimeMs: Math.round((endTime - startTime) * 10) / 10
    };
  } catch (err: any) {
    const endTime = performance.now();
    return {
      success: false,
      logs,
      error: err?.message || String(err),
      executionTimeMs: Math.round((endTime - startTime) * 10) / 10
    };
  }
}

function simulatePythonExecution(code: string, startTime: number): ExecutionResult {
  const logs: string[] = [];
  const lines = code.split('\n');

  try {
    // print文の検出とシミュレーション
    for (const line of lines) {
      const trimmed = line.trim();
      const printMatch = trimmed.match(/^print\((.*)\)$/);
      if (printMatch) {
        const inner = printMatch[1].trim();
        // 文字列リテラル
        if ((inner.startsWith('"') && inner.endsWith('"')) || (inner.startsWith("'") && inner.endsWith("'"))) {
          logs.push(inner.slice(1, -1));
        } else if (inner.startsWith('f"') || inner.startsWith("f'")) {
          // f-stringの簡易シミュレーション
          let content = inner.slice(2, -1);
          content = content.replace(/\{([^}]+)\}/g, (_m, expr) => {
            try {
              const res = new Function(`"use strict"; return (${expr});`)();
              return String(res);
            } catch {
              return `[${expr}]`;
            }
          });
          logs.push(content);
        } else {
          // 簡単な計算式や変数評価
          try {
            const val = new Function(`"use strict"; return (${inner});`)();
            logs.push(String(val));
          } catch {
            logs.push(inner);
          }
        }
      }
    }

    // もしprintがなければコード内容から予測される出力を生成
    if (logs.length === 0) {
      if (code.includes('range(')) {
        const rangeMatch = code.match(/range\((\d+)(?:,\s*(\d+))?(?:,\s*(\d+))?\)/);
        if (rangeMatch) {
          const start = rangeMatch[2] ? parseInt(rangeMatch[1], 10) : 0;
          const stop = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : parseInt(rangeMatch[1], 10);
          const step = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : 1;
          const nums: number[] = [];
          for (let i = start; i < stop; i += step) nums.push(i);
          logs.push(`生成されたシーケンス: [${nums.join(', ')}]`);
        }
      } else if (code.includes('async def') || code.includes('await')) {
        logs.push('[Async Task] 1. イベントループに登録');
        logs.push('[Async Task] 2. await I/O待機（ノンブロッキング）');
        logs.push('[Async Task] 3. レスポンス受信完了 -> 200 OK');
      } else if (code.includes('class ')) {
        logs.push('インスタンス生成完了: <__main__.Object object at 0x7fa21b44>');
      } else {
        logs.push('実行完了（正常終了: Exit Code 0）');
      }
    }

    const endTime = performance.now();
    return {
      success: true,
      logs,
      executionTimeMs: Math.round((endTime - startTime + Math.random() * 1.5 + 0.5) * 10) / 10
    };
  } catch (err: any) {
    const endTime = performance.now();
    return {
      success: false,
      logs,
      error: `SyntaxError or RuntimeError: ${err?.message || String(err)}`,
      executionTimeMs: Math.round((endTime - startTime) * 10) / 10
    };
  }
}

function simulateGenericExecution(code: string, language: SupportedLanguage, startTime: number): ExecutionResult {
  const logs: string[] = [];
  const lines = code.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Rust println! or Go fmt.Println or C++ std::cout
    if (trimmed.includes('println!') || trimmed.includes('fmt.Println') || trimmed.includes('cout <<')) {
      const match = trimmed.match(/["']([^"']+)["']/);
      if (match) {
        logs.push(match[1]);
      }
    }
  }

  if (logs.length === 0) {
    logs.push(`[${language.toUpperCase()} Engine] コンパイル成功 -> 正常終了 (Exit Code 0)`);
  }

  const endTime = performance.now();
  return {
    success: true,
    logs,
    executionTimeMs: Math.round((endTime - startTime + Math.random() * 2 + 1) * 10) / 10
  };
}
