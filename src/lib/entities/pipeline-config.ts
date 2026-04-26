export type PipelineInputType = 'http' | 'syslog' | 'file' | 'nats';

export type PipelineConfigObject = Record<string, unknown>;

export interface PipelineConfig {
  id?: string;
  name: string;
  enabled: boolean;
  inputType: PipelineInputType;
  source?: string;
  format?: string;
  description?: string;
  config?: PipelineConfigObject;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PipelineSavePayload {
  id?: string;
  name: string;
  enabled: boolean;
  inputType: PipelineInputType;
  source: string;
  format: string;
  description?: string;
  config: PipelineConfigObject;
}

export type PipelineCreatePayload = PipelineSavePayload;
export type PipelineUpdatePayload = PipelineSavePayload;

export interface PipelineSearchParams {
  query?: string;
  inputType?: PipelineInputType | '';
  enabled?: 'true' | 'false' | '';
}
