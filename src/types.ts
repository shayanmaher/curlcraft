export interface ParsedCurl {
  raw: string;
  method: string;
  url: string;
  baseUrl: string;
  pathname: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'custom';
    token?: string;
    username?: string;
    password?: string;
    headerKey?: string;
    headerValue?: string;
  };
  body?: string;
  jsonBody?: any;
  contentType?: string;
}

export type SupportedLanguage = 'typescript' | 'python' | 'go';

export interface GenerateOptions {
  language?: SupportedLanguage;
  format?: 'function' | 'class';
  includeZod?: boolean;
  functionName?: string;
  clientName?: string;
  baseUrl?: string;
}

export interface GeneratedCode {
  code: string;
  language: SupportedLanguage;
  typesOnly?: string;
  suggestedFilename: string;
}
