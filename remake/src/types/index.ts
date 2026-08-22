export * from './ast';

export type SupportedLanguage =
  | 'python'
  | 'typescript'
  | 'javascript'
  | 'rust'
  | 'go'
  | 'cpp'
  | 'sql'
  | 'json'
  | 'html'
  | 'css'
  | 'shell';

export type SymbolKind =
  | 'class'
  | 'struct'
  | 'interface'
  | 'enum'
  | 'function'
  | 'method'
  | 'variable'
  | 'constant'
  | 'type'
  | 'import'
  | 'decorator';

export type PatternTag =
  | 'async'
  | 'io'
  | 'net'
  | 'recursive'
  | 'generator'
  | 'database'
  | 'unsafe'
  | 'pure'
  | 'memoized'
  | 'deprecated';

export type ArchitectureRole =
  | 'orchestrator'   // 司令塔
  | 'pure_logic'     // 計算層
  | 'io_effect'      // I/O・副作用層
  | 'validator'      // 検証層
  | 'mixed';         // 責務混在

export type BigOComplexity = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n^2)' | 'O(n^3)' | 'O(2^n)';

export interface ArchitectureDiagnosis {
  symbolName: string;
  role: ArchitectureRole;
  roleConfidence: number;
  cohesionScore: number;
  detectedResponsibilities: string[];
  isOverloaded: boolean;
  refactorAdvice: string;
  proposedSteps?: string[];
}

export interface OrchestrationBlueprint {
  targetSymbol: string;
  orchestratorCode: string;
  extractedStepCodes: { name: string; role: string; code: string }[];
  explanation: string;
}

export interface ImportEntry {
  source: string;
  symbols: string[];
  isStandardLib: boolean;
  line: number;
}

export interface SymbolNode {
  id: string;
  name: string;
  kind: SymbolKind;
  parentName?: string;
  startLine: number;
  endLine: number;
  parameters?: string[];
  returnType?: string;
  docstring?: string;
  decorators?: string[];
  extendsClasses?: string[];
  implementsInterfaces?: string[];
  isExported?: boolean;
  tags: PatternTag[];
  architectureRole?: ArchitectureRole;
  bigO?: BigOComplexity;
  bigOReason?: string;
  calls: string[];
}

export interface CallEdge {
  id: string;
  source: string;
  target: string;
  sourceName: string;
  targetName: string;
  count: number;
  lines: number[];
}

export interface DictOccurrence {
  file?: string;
  line: number;
  preview: string;
}

export interface SyntaxToken {
  text: string;
  role?: string;
  type?: string;
  description?: string;
  explanation?: string;
  color?: string;
}

export interface SyntaxAnatomyData {
  title: string;
  code?: string;
  codeTemplate?: string;
  description?: string;
  tokens: SyntaxToken[];
  explanation?: string;
}

export interface VisualConceptData {
  title: string;
  type: string;
  description: string;
  defaultMode?: string;
  modes?: any[];
  steps?: {
    label: string;
    detail: string;
    highlight?: boolean;
    state?: string;
  }[];
}

export interface QuizOption {
  id?: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizItem {
  question: string;
  options: QuizOption[];
  hint?: string;
}

export interface InteractiveExplanation {
  anatomy?: SyntaxAnatomyData;
  visualConcept?: VisualConceptData;
  conceptSim?: VisualConceptData;
  quiz?: QuizItem;
  playgroundDefaultCode?: string;
}

export interface DictEntry {
  term: string;
  language: SupportedLanguage | 'all';
  category: 'keyword' | 'builtin' | 'standard_lib' | 'syntax' | 'type' | 'framework' | 'custom_symbol' | 'ast_node';
  summary: string;
  detailedExplanation: string;
  example?: string;
  bestPractice?: string;
  definedInFile?: string;
  definedLine?: number;
  occurrences?: DictOccurrence[];
  interactive?: InteractiveExplanation;
}

export interface QualityIssue {
  id: string;
  line: number;
  column?: number;
  severity: 'info' | 'warning' | 'error';
  message: string;
  rule: string;
  suggestion?: string;
}

export interface SecurityIssue {
  id: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'hardcoded-secret' | 'unsafe-eval' | 'sql-injection' | 'insecure-deserialization' | 'xss-vulnerability' | 'path-traversal';
  message: string;
  snippet?: string;
  remediation: string;
}

export interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  functionCount: number;
  classCount: number;
  orchestratorCount: number;
  pureLogicCount: number;
  ioEffectCount: number;
  mixedCount: number;
  healthScore: number;
  securityScore: number;
  maintainabilityIndex: number;
  issues: QualityIssue[];
  securityIssues: SecurityIssue[];
}

export interface RefactorSuggestion {
  id: string;
  title: string;
  description: string;
  targetSymbol?: string;
  line?: number;
  codeBefore?: string;
  codeAfter?: string;
  impact: 'high' | 'medium' | 'low';
}

import { ASTNode } from './ast';

export interface AnalysisResult {
  fileName: string;
  language: SupportedLanguage;
  code: string;
  astRoot: ASTNode;
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
  metrics: CodeMetrics;
  architectureDiagnoses: ArchitectureDiagnosis[];
  blueprints: OrchestrationBlueprint[];
  refactorSuggestions: RefactorSuggestion[];
  matchedDictEntries: DictEntry[];
  timestamp: string;
}

export interface ProjectFileEntry {
  path: string;
  name: string;
  language: SupportedLanguage;
  code: string;
  analysis: AnalysisResult;
}

export interface ModuleDependencyEdge {
  id: string;
  sourceFile: string;
  targetFile: string;
  importedSymbols: string[];
}

export interface ProjectAnalysisResult {
  projectName: string;
  files: ProjectFileEntry[];
  dependencyEdges: ModuleDependencyEdge[];
  masterDictionary: DictEntry[];
  totalMetrics: {
    totalLines: number;
    codeLines: number;
    fileCount: number;
    symbolCount: number;
    healthScore: number;
    securityIssuesCount: number;
  };
}

export interface ClusterLayout {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeIds: string[];
}

export interface GraphNodeLayout {
  id: string;
  symbol: SymbolNode;
  x: number;
  y: number;
  width: number;
  height: number;
  isEntry: boolean;
  isLeaf: boolean;
  layer: number;
  clusterId?: string;
}

export interface GraphEdgeLayout {
  id: string;
  edge: CallEdge;
  points: { x: number; y: number }[];
  sourceNode: GraphNodeLayout;
  targetNode: GraphNodeLayout;
}

export interface GraphLayout {
  nodes: GraphNodeLayout[];
  edges: GraphEdgeLayout[];
  clusters: ClusterLayout[];
  width: number;
  height: number;
}
