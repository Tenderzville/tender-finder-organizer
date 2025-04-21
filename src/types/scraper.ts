
export interface ScraperSource {
  name: string;
  count: number;
  status: string;
}

export interface ScraperStatusData {
  lastRun: string | null;
  status: 'idle' | 'running' | 'success' | 'failed';
  tendersFound: number;
  agpoTendersFound: number;
  sources: ScraperSource[];
  diagnostics: any | null;
  apiLayerConfigured: boolean;
  apiLayerStatus?: string;
}
