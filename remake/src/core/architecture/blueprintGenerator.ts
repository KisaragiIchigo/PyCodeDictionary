import { ArchitectureDiagnosis, OrchestrationBlueprint, SupportedLanguage } from '../../types';

export function generateOrchestrationBlueprints(
  diagnoses: ArchitectureDiagnosis[],
  language: SupportedLanguage
): OrchestrationBlueprint[] {
  const mixedList = diagnoses.filter(d => d.isOverloaded || d.role === 'mixed');
  const blueprints: OrchestrationBlueprint[] = [];

  for (const diag of mixedList) {
    const rawName = diag.symbolName.includes('.') ? diag.symbolName.split('.').pop()! : diag.symbolName;
    const isPy = language === 'python';

    if (isPy) {
      const orchestratorCode = `# 【ウィズ流オーケストレータ設計】\n# 司令塔: 各ステップを宣言順に呼ぶだけに特化（~20行）\nasync def ${rawName}_orchestrator(payload: dict) -> dict:\n    # 1. 入力検証 (Guard)\n    validate_${rawName}_input(payload)\n\n    # 2. データ取得・外部I/O (Effect)\n    raw_data = await fetch_${rawName}_dependencies(payload)\n\n    # 3. ビジネス計算・集計 (Pure Logic)\n    computed_result = compute_${rawName}_core(raw_data)\n\n    # 4. 状態保存・永続化 (Effect)\n    await save_${rawName}_state(computed_result)\n\n    return {"status": "ok", "data": computed_result}`;

      const extractedStepCodes = [
        {
          name: `validate_${rawName}_input`,
          role: '🛡️ Validator',
          code: `def validate_${rawName}_input(payload: dict):\n    if not payload:\n        raise ValueError("Payload cannot be empty")`
        },
        {
          name: `fetch_${rawName}_dependencies`,
          role: '🌐 I/O Effect',
          code: `async def fetch_${rawName}_dependencies(payload: dict) -> dict:\n    # API通信やDB取得のみを行う副作用関数\n    async with httpx.AsyncClient() as client:\n        resp = await client.get(f"https://api.example.com/data")\n        return resp.json()`
        },
        {
          name: `compute_${rawName}_core`,
          role: '⚡ Pure Logic',
          code: `def compute_${rawName}_core(data: dict) -> dict:\n    # 副作用なし・単体テストが極めて容易な計算関数\n    return {\n        "processed": True,\n        "total": sum(data.get("items", []))\n    }`
        },
        {
          name: `save_${rawName}_state`,
          role: '💾 Persistence',
          code: `async def save_${rawName}_state(result: dict):\n    # ファイル保存やDBコミットのみを行う永続化関数\n    pass`
        }
      ];

      blueprints.push({
        targetSymbol: diag.symbolName,
        orchestratorCode,
        extractedStepCodes,
        explanation: `関数 '${diag.symbolName}' に同居していた「検証」「通信」「計算」「保存」の4つの責務をそれぞれ専用の独立関数に切り出し、本体はそれらを宣言順に呼び出すオーケストレータ（司令塔）に再構築しました。`
      });
    } else {
      // TypeScript / JavaScript
      const orchestratorCode = `// 【ウィズ流オーケストレータ設計】\n// 司令塔: 各ステップを宣言順に呼ぶだけに特化\nexport async function run${rawName.charAt(0).toUpperCase() + rawName.slice(1)}Pipeline(payload: RequestPayload): Promise<ResultPayload> {\n  // 1. 入力検証 (Guard)\n  validate${rawName.charAt(0).toUpperCase() + rawName.slice(1)}Payload(payload);\n\n  // 2. データ取得 (I/O Effect)\n  const sourceData = await fetch${rawName.charAt(0).toUpperCase() + rawName.slice(1)}Data(payload);\n\n  // 3. 純粋計算 (Pure Logic)\n  const result = compute${rawName.charAt(0).toUpperCase() + rawName.slice(1)}Core(sourceData);\n\n  // 4. 永続化 (Side Effect)\n  await persist${rawName.charAt(0).toUpperCase() + rawName.slice(1)}Result(result);\n\n  return result;\n}`;

      const extractedStepCodes = [
        {
          name: `validate${rawName.charAt(0).toUpperCase() + rawName.slice(1)}Payload`,
          role: '🛡️ Validator',
          code: `export function validate${rawName.charAt(0).toUpperCase() + rawName.slice(1)}Payload(payload: RequestPayload): void {\n  if (!payload || !payload.id) {\n    throw new Error('Invalid payload');\n  }\n}`
        },
        {
          name: `compute${rawName.charAt(0).toUpperCase() + rawName.slice(1)}Core`,
          role: '⚡ Pure Logic',
          code: `export function compute${rawName.charAt(0).toUpperCase() + rawName.slice(1)}Core(data: SourceData): ResultPayload {\n  // 副作用なし（Pure Function）\n  return {\n    id: data.id,\n    score: data.metrics.reduce((acc, curr) => acc + curr, 0)\n  };\n}`
        }
      ];

      blueprints.push({
        targetSymbol: diag.symbolName,
        orchestratorCode,
        extractedStepCodes,
        explanation: `肥大化した '${diag.symbolName}' を、純粋関数（Pure Function）による計算層と、副作用を伴うI/O層、およびそれらを統括するオーケストレータへ分離した設計青写真です。`
      });
    }
  }

  return blueprints;
}
