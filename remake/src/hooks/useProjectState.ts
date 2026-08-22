import { useState, useCallback, useEffect } from 'react';
import {
  SupportedLanguage,
  AnalysisResult,
  ProjectAnalysisResult,
  ProjectFileEntry
} from '../types';
import { runFullAnalysis, runFullAnalysisAsync } from '../core/analyzer';
import { analyzeProject, isCodeFile, isIgnoredPath } from '../core/multiFile/projectScanner';
import { sampleCodePresets } from '../core/presets/sampleCodes';

export function useProjectState() {
  const defaultPreset = sampleCodePresets[0];

  const [fileName, setFileName] = useState<string>(defaultPreset.fileName);
  const [filePath, setFilePath] = useState<string>(defaultPreset.fileName);
  const [language, setLanguage] = useState<SupportedLanguage>(defaultPreset.language);
  const [code, setCode] = useState<string>(defaultPreset.code);
  const [targetLine, setTargetLine] = useState<number | null>(null);

  const [projectData, setProjectData] = useState<ProjectAnalysisResult | null>(() => {
    return analyzeProject('Sample Project', [
      { path: defaultPreset.fileName, name: defaultPreset.fileName, content: defaultPreset.code },
      { path: sampleCodePresets[1].fileName, name: sampleCodePresets[1].fileName, content: sampleCodePresets[1].code },
      { path: sampleCodePresets[2].fileName, name: sampleCodePresets[2].fileName, content: sampleCodePresets[2].code },
      { path: sampleCodePresets[3].fileName, name: sampleCodePresets[3].fileName, content: sampleCodePresets[3].code }
    ]);
  });

  const [isProjectMode, setIsProjectMode] = useState<boolean>(false);

  const [analysis, setAnalysis] = useState<AnalysisResult>(() =>
    runFullAnalysis(defaultPreset.code, defaultPreset.fileName, defaultPreset.language)
  );

  const executeAnalysis = useCallback((sourceCode: string, name: string, lang?: SupportedLanguage) => {
    // 1. 同期パーサーによる即時レスポンス
    const syncRes = runFullAnalysis(sourceCode, name, lang);
    setAnalysis(syncRes);
    setLanguage(syncRes.language);

    // 2. Tree-sitter WASM による非同期超高精度解析（利用可能な場合）
    runFullAnalysisAsync(sourceCode, name, lang).then(asyncRes => {
      setAnalysis(asyncRes);
    }).catch(err => {
      console.warn('Tree-sitter background analysis error:', err);
    });
  }, []);

  const handleLoadPreset = useCallback((presetId: string) => {
    const preset = sampleCodePresets.find(p => p.id === presetId);
    if (preset) {
      setFileName(preset.fileName);
      setFilePath(preset.fileName);
      setLanguage(preset.language);
      setCode(preset.code);
      setTargetLine(null);
      setIsProjectMode(false);
      executeAnalysis(preset.code, preset.fileName, preset.language);
    }
  }, [executeAnalysis]);

  const handleLanguageChange = useCallback((newLang: SupportedLanguage) => {
    setLanguage(newLang);
    executeAnalysis(code, fileName, newLang);
  }, [code, fileName, executeAnalysis]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text !== undefined) {
        setFileName(file.name);
        setFilePath(file.name);
        setCode(text);
        setTargetLine(null);
        setIsProjectMode(false);
        executeAnalysis(text, file.name);
      }
    };
    reader.readAsText(file);
  }, [executeAnalysis]);

  const handleFolderSelect = useCallback(async (files: FileList) => {
    const rawFiles: { path: string; name: string; content: string }[] = [];
    const readPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath || file.name;

      if (isCodeFile(file.name) && !isIgnoredPath(relPath)) {
        const p = new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content !== undefined) {
              rawFiles.push({
                path: relPath,
                name: file.name,
                content
              });
            }
            resolve();
          };
          reader.readAsText(file);
        });
        readPromises.push(p);
      }
    }

    await Promise.all(readPromises);

    if (rawFiles.length > 0) {
      const folderName = rawFiles[0].path.split(/[/\\]/)[0] || 'Project';
      const projResult = analyzeProject(folderName, rawFiles);
      setProjectData(projResult);
      setIsProjectMode(true);

      const firstFile = projResult.files[0];
      setFileName(firstFile.name);
      setFilePath(firstFile.path);
      setLanguage(firstFile.language);
      setCode(firstFile.code);
      setAnalysis(firstFile.analysis);
    }
  }, []);

  const handleSelectProjectFile = useCallback((file: ProjectFileEntry) => {
    setFileName(file.name);
    setFilePath(file.path);
    setLanguage(file.language);
    setCode(file.code);
    setTargetLine(null);
    setAnalysis(file.analysis);
    setIsProjectMode(false);
  }, []);

  const handleApplyRefactor = useCallback((newCodeOrBefore?: string, codeAfter?: string) => {
    if (codeAfter && newCodeOrBefore) {
      if (code.includes(newCodeOrBefore)) {
        const updated = code.replace(newCodeOrBefore, codeAfter);
        setCode(updated);
        executeAnalysis(updated, fileName, language);
      }
    } else if (newCodeOrBefore) {
      const updated = `${code}\n\n${newCodeOrBefore}`;
      setCode(updated);
      executeAnalysis(updated, fileName, language);
    }
  }, [code, fileName, language, executeAnalysis]);

  return {
    fileName,
    filePath,
    language,
    code,
    setCode,
    targetLine,
    setTargetLine,
    projectData,
    isProjectMode,
    setIsProjectMode,
    analysis,
    executeAnalysis,
    handleLoadPreset,
    handleLanguageChange,
    handleFile,
    handleFolderSelect,
    handleSelectProjectFile,
    handleApplyRefactor
  };
}
