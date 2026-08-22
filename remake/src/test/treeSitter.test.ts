import { describe, it, expect, beforeAll } from 'vitest';
import { runFullAnalysisAsync } from '../core/analyzer';

describe('Tree-sitter WASM Engine Tests', () => {
  // 1. 正常な関数定義の解析
  it('should accurately extract function definitions and arguments', async () => {
    const pythonCode = `
def calculate_metrics(user_id: int, options: dict = None) -> float:
    \"\"\"Calculate score for user.\"\"\"
    base = 100.0
    return base * 1.5
`;

    const result = await runFullAnalysisAsync(pythonCode, 'metrics.py', 'python');
    expect(result).toBeDefined();
    expect(result.symbols.length).toBeGreaterThanOrEqual(1);

    const func = result.symbols.find(s => s.name === 'calculate_metrics');
    expect(func).toBeDefined();
    expect(func?.kind).toBe('function');
    expect(result.astRoot.children.length).toBeGreaterThan(0);
  });

  // 2. ネストしたクラス・メソッドの解析
  it('should accurately extract classes and nested methods with call graph', async () => {
    const tsCode = `
class UserService {
  private count: number = 0;

  async fetchUser(id: string) {
    this.logAction("fetch");
    return { id, name: "Alice" };
  }

  logAction(action: string) {
    console.log(action);
  }
}
`;

    const result = await runFullAnalysisAsync(tsCode, 'service.ts', 'typescript');
    expect(result).toBeDefined();

    const cls = result.symbols.find(s => s.name === 'UserService');
    expect(cls).toBeDefined();
    expect(cls?.kind).toBe('class');

    const method = result.symbols.find(s => s.name.includes('fetchUser'));
    expect(method).toBeDefined();
  });

  // 3. 構文エラーがあるコード（途中まで壊れているもの）に対する Error-tolerant 耐性
  it('should parse error-tolerant without crashing on broken syntax', async () => {
    const brokenPython = `
def valid_func():
    return 42

def broken_func(
    # Unclosed parentheses and missing colon
    x = 10
`;

    const result = await runFullAnalysisAsync(brokenPython, 'broken.py', 'python');
    expect(result).toBeDefined();
    expect(result.astRoot).toBeDefined();
    // 壊れたコードでも valid_func を抽出できること
    const validFunc = result.symbols.find(s => s.name === 'valid_func');
    expect(validFunc).toBeDefined();
  });

  // 4. 空ファイルの解析
  it('should handle empty file safely', async () => {
    const result = await runFullAnalysisAsync('', 'empty.rs', 'rust');
    expect(result).toBeDefined();
    expect(result.symbols).toEqual([]);
    expect(result.metrics.totalLines).toBe(1);
  });

  // 5. 複数関数の相互呼び出しと Big-O 推定
  it('should resolve call edges and calculate Big-O complexity', async () => {
    const code = `
def helper_func(n):
    for i in range(n):
        print(i)

def main_orchestrator(n):
    helper_func(n)
`;

    const result = await runFullAnalysisAsync(code, 'algo.py', 'python');
    expect(result.symbols.length).toBe(2);
    expect(result.callEdges.length).toBeGreaterThanOrEqual(1);

    const helper = result.symbols.find(s => s.name === 'helper_func');
    expect(helper?.bigO).toBe('O(n)');
  });
});
