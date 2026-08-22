import { SymbolNode, ArchitectureRole, PatternTag } from '../../types';

export interface ClassifyResult {
  role: ArchitectureRole;
  confidence: number;
  responsibilities: string[];
  isOverloaded: boolean;
  advice: string;
  proposedSteps?: string[];
}

export function classifyFunctionRole(sym: SymbolNode, code: string): ClassifyResult {
  // 関数コードの抽出
  const lines = code.split('\n');
  const funcLines = lines.slice(Math.max(0, sym.startLine - 1), sym.endLine);
  const funcCode = funcLines.join('\n');

  const responsibilities: string[] = [];

  // 1. I/O通信・ファイル操作の検知
  const hasIO = sym.tags.includes('io') || sym.tags.includes('net') || sym.tags.includes('database') ||
    /fetch\(|axios\.|open\(|writeFile|readFile|http\.|requests\.|httpx\./.test(funcCode);
  if (hasIO) responsibilities.push('I/O・通信・ファイル操作');

  // 2. ビジネス計算・データ変換の検知
  const hasComputation = /reduce\(|map\(|filter\(|sum\(|for\s+.*?\s+in|\.forEach\(|\.sort\(|\.calculate|\.compute|[+\-*/%]\s*=/.test(funcCode);
  if (hasComputation) responsibilities.push('計算・データ変換・集計');

  // 3. 入力検証・バリデーションの検知
  const hasValidation = /if\s+.*?(?:==\s*null|===?\s*undefined|!\w+|len\(|<|>|<=|>=)\s*:\s*(?:return|raise|throw)|if\s*\(!.*?\)\s*(?:return|throw)/.test(funcCode);
  if (hasValidation) responsibilities.push('入力検証・ガード節');

  // 4. 状態変更・永続化の検知
  const hasPersistence = /localStorage|sessionStorage|\.save\(|\.commit\(|\.execute\(|json\.dump/.test(funcCode);
  if (hasPersistence) responsibilities.push('ストレージ永続化・状態更新');

  const lineCount = sym.endLine - sym.startLine + 1;
  const childCallsCount = sym.calls.length;

  // --- 役割判定ロジック ---

  // A. 責務混在 (Mixed / God Function): 複数の重い責務が同居し行数が長い
  if (responsibilities.length >= 3 || (responsibilities.length >= 2 && lineCount > 30)) {
    const proposedSteps = [
      `validate_${sym.name.replace(/^[A-Z]/, c => c.toLowerCase())}_input`,
      `fetch_or_read_source_data`,
      `compute_core_logic`,
      `persist_or_respond`
    ];

    return {
      role: 'mixed',
      confidence: 85,
      responsibilities,
      isOverloaded: true,
      advice: `この関数は「${responsibilities.join('」「')}」の責務が同居しています。計算層（Pure Function）とI/O層を別関数に切り出し、本体はそれらを宣言順に呼ぶオーケストレータに特化させましょう。`,
      proposedSteps
    };
  }

  // B. オーケストレータ (Orchestrator): 子関数の呼び出しが多く、自身のベタ計算が少ない
  if (childCallsCount >= 3 || (childCallsCount >= 2 && (sym.name.includes('pipeline') || sym.name.includes('run') || sym.name.includes('execute') || sym.name.includes('process') || sym.name.includes('main')))) {
    return {
      role: 'orchestrator',
      confidence: 90,
      responsibilities: ['処理フロー統括・オーケストレーション', ...responsibilities],
      isOverloaded: false,
      advice: '美しいオーケストレーション構成です！本体は処理の流れ（各ステップの呼び出し）に専念できています。'
    };
  }

  // C. バリデータ (Validator): ガード・検証が主
  if (hasValidation && !hasIO && lineCount <= 20) {
    return {
      role: 'validator',
      confidence: 85,
      responsibilities: ['入力値検証・バリデーション'],
      isOverloaded: false,
      advice: '入力検証に特化した単一責任の関数です。'
    };
  }

  // D. I/O・副作用層 (I/O & Effect)
  if (hasIO && !hasComputation) {
    return {
      role: 'io_effect',
      confidence: 90,
      responsibilities: ['外部I/O通信・データ取得'],
      isOverloaded: false,
      advice: '外部システムとの通信/I/Oに特化した副作用レイヤーです。計算ロジックを混ぜずにこのまま保ちましょう。'
    };
  }

  // E. 純粋計算層 (Pure Logic)
  return {
    role: 'pure_logic',
    confidence: 80,
    responsibilities: ['純粋計算・データ整形'],
    isOverloaded: false,
    advice: '副作用を持たないピュアな計算層です。テストが容易で再利用性が極めて高い状態です。'
  };
}
