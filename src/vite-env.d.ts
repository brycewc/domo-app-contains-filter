/// <reference types="vite/client" />

declare module 'ryuu.js' {
  const domo: {
    env: {
      userId: string;
      customer: string;
      pageId: string;
      locale: string;
      platform: string;
    };
    get: (url: string, options?: unknown) => Promise<unknown>;
    post: (url: string, body?: unknown, options?: unknown) => Promise<unknown>;
    put: (url: string, body?: unknown, options?: unknown) => Promise<unknown>;
    delete: (url: string, options?: unknown) => Promise<unknown>;
    getAll: (urls: string[]) => Promise<unknown[]>;
    navigate: (url: string, newTab?: boolean) => void;
    onFiltersUpdated: (callback: (filters: unknown[]) => void) => void;
    onDataUpdated: (callback: (alias: string) => void) => void;
    requestFiltersUpdate: (
      filters: {
        column: string;
        operator: string;
        values: unknown[];
        dataType: string;
      }[],
      applyToPage: boolean,
      onAck?: () => void,
      onComplete?: (response: unknown) => void,
    ) => void;
  };
  export default domo;
}

interface ImportMetaEnv {
  readonly DOMO_SUPPORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
