import { DictEntry, SupportedLanguage, DictOccurrence } from '../../types';
import { pythonDictionary } from './pythonDict';
import { jsTsDictionary } from './jsTsDict';
import { rustDictionary } from './rustDict';
import { goDictionary } from './goDict';

export const allDictionaries: Record<SupportedLanguage | 'all', DictEntry[]> = {
  python: pythonDictionary,
  typescript: jsTsDictionary,
  javascript: jsTsDictionary,
  rust: rustDictionary,
  go: goDictionary,
  cpp: [
    {
      term: 'template',
      language: 'cpp',
      category: 'keyword',
      summary: '型に依存しない汎用的な関数やクラスを定義するテンプレート構文',
      detailedExplanation: 'コンパイル時にコードが具体型に応じて実体化（単相化）されるため、実行時オーバーヘッドなしでジェネリックプログラミングが可能です。',
      example: 'template <typename T>\nT max_value(T a, T b) {\n    return (a > b) ? a : b;\n}'
    },
    {
      term: 'std::unique_ptr',
      language: 'cpp',
      category: 'standard_lib',
      summary: '排他的な所有権を持つスマートポインタ（RAII）',
      detailedExplanation: 'スコープを抜けると自動で管理対象のメモリが解放されます。std::make_unique で安全に生成します。',
      example: 'auto ptr = std::make_unique<Widget>();'
    }
  ],
  sql: [
    {
      term: 'SELECT',
      language: 'sql',
      category: 'keyword',
      summary: 'データベースのテーブルからデータを取得します',
      detailedExplanation: '列の指定、集計関数、サブクエリなどを組み合わせて必要なレコードを射影します。',
      example: 'SELECT id, username, email FROM users WHERE is_active = 1;'
    },
    {
      term: 'JOIN',
      language: 'sql',
      category: 'keyword',
      summary: '複数のテーブルをキーで結合して1つの結果セットを生成します',
      detailedExplanation: 'INNER JOIN, LEFT OUTER JOIN, RIGHT JOIN, FULL JOIN などがあります。',
      example: 'SELECT u.name, o.order_date FROM users u LEFT JOIN orders o ON u.id = o.user_id;'
    }
  ],
  json: [
    {
      term: 'object',
      language: 'json',
      category: 'syntax',
      summary: 'キーと値のペアを波括弧 {} で囲む連想データ構造',
      detailedExplanation: 'キーは必ずダブルクォートで囲まれた文字列である必要があります。'
    }
  ],
  html: [
    {
      term: '<div>',
      language: 'html',
      category: 'syntax',
      summary: '特別な意味を持たない汎用的なブロックレベルコンテナ要素',
      detailedExplanation: 'CSSスタイリングやスクリプトでのグループ化に用います。'
    }
  ],
  css: [
    {
      term: 'display: flex',
      language: 'css',
      category: 'syntax',
      summary: 'フレキシブルボックスレイアウトモデルを適用します',
      detailedExplanation: '子要素を主軸に沿って柔軟に配置・整列・伸縮させます。'
    }
  ],
  shell: [
    {
      term: 'pipe (|)',
      language: 'shell',
      category: 'syntax',
      summary: '直前のコマンドの標準出力を後続コマンドの標準入力へ渡します',
      detailedExplanation: '小さなプログラムを組み合わせて複雑な処理を行う根幹です。',
      example: 'cat access.log | grep "404" | wc -l'
    }
  ],
  all: []
};

/**
 * ソースコード内で出現している辞書エントリを検出し、出現箇所（行番号・プレビュー）を付与して返します
 */
export function resolveMatchedDictEntries(code: string, language: SupportedLanguage, fileName?: string): DictEntry[] {
  const langDict = allDictionaries[language] || [];
  const lines = code.split('\n');

  const matched: DictEntry[] = [];

  for (const entry of langDict) {
    const occurrences: DictOccurrence[] = [];
    const termRegex = new RegExp(`\\b${escapeRegExp(entry.term)}\\b`, 'g');

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      if (termRegex.test(lineText)) {
        occurrences.push({
          file: fileName,
          line: i + 1,
          preview: lineText.trim()
        });
      }
    }

    if (occurrences.length > 0) {
      matched.push({
        ...entry,
        occurrences
      });
    }
  }

  return matched;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 単語から辞書エントリをピンポイントで検索します（インラインホバー用）
 */
export function findDictEntryForWord(
  word: string,
  language: SupportedLanguage,
  projectMasterDict?: DictEntry[]
): DictEntry | undefined {
  if (!word) return undefined;
  const cleanWord = word.trim();

  // 1. プロジェクト内定義シンボルから検索
  if (projectMasterDict) {
    const projMatch = projectMasterDict.find(
      e => e.term === cleanWord || e.term.endsWith(`.${cleanWord}`)
    );
    if (projMatch) return projMatch;
  }

  // 2. 言語標準辞書から検索
  const langDict = allDictionaries[language] || [];
  return langDict.find(e => e.term.toLowerCase() === cleanWord.toLowerCase());
}
