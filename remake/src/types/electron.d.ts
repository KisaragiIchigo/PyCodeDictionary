export interface ElectronAPI {
  getVersion: () => Promise<string>;
  openFileDialog: (options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{ canceled: boolean; filePaths: string[] } | null>;
  openFolderDialog: () => Promise<{ canceled: boolean; filePaths: string[] } | null>;
  openExternal: (url: string) => Promise<boolean>;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
