import { ProjectFileEntry, ModuleDependencyEdge } from '../../types';

export function buildProjectDependencyGraph(files: ProjectFileEntry[]): ModuleDependencyEdge[] {
  const edges: ModuleDependencyEdge[] = [];
  const fileMap = new Map<string, ProjectFileEntry>();

  // ファイル名（ベース名および相対パス）のインデックス
  for (const f of files) {
    fileMap.set(f.name, f);
    fileMap.set(f.path, f);
    const baseNameWithoutExt = f.name.replace(/\.[^/.]+$/, '');
    fileMap.set(baseNameWithoutExt, f);
  }

  for (const srcFile of files) {
    for (const imp of srcFile.analysis.imports) {
      // 内部インポートの解決 (./utils, ../services/auth, utils 等)
      const cleanSource = imp.source.replace(/^\.\/|^\.\.\//, '').replace(/\.[^/.]+$/, '');
      const lastSegment = cleanSource.split(/[/\\]/).pop() || cleanSource;

      let matchedTarget: ProjectFileEntry | undefined = undefined;

      if (fileMap.has(cleanSource)) {
        matchedTarget = fileMap.get(cleanSource);
      } else if (fileMap.has(lastSegment)) {
        matchedTarget = fileMap.get(lastSegment);
      }

      if (matchedTarget && matchedTarget.path !== srcFile.path) {
        const edgeId = `${srcFile.path}->${matchedTarget.path}`;
        const existing = edges.find(e => e.id === edgeId);

        if (existing) {
          for (const s of imp.symbols) {
            if (!existing.importedSymbols.includes(s)) {
              existing.importedSymbols.push(s);
            }
          }
        } else {
          edges.push({
            id: edgeId,
            sourceFile: srcFile.name,
            targetFile: matchedTarget.name,
            importedSymbols: [...imp.symbols]
          });
        }
      }
    }
  }

  return edges;
}
