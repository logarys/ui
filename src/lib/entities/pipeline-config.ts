export type PipelineInputType = 'http' | 'syslog' | 'file' | 'nats';
export type PipelineParserType = 'raw' | 'json' | 'regex' | 'loki';

export type PipelineConfigObject = Record<string, unknown>;

export interface PipelineParserConfig extends PipelineConfigObject {
  type?: string;
  pattern?: string;
  regex?: string;
}

export interface PipelineMappingConfig extends PipelineConfigObject {
  timestamp?: string;
  level?: string;
  message?: string;
  source?: string;
  host?: string;
  service?: string;
  env?: string;
}

export interface PipelinePublishConfig extends PipelineConfigObject {
  subject?: string;
}

export interface PipelineSecurityConfig extends PipelineConfigObject {
  mode?: string;
  token?: string;
}

export interface PipelineDefaultsConfig extends PipelineConfigObject {
  source?: string;
  host?: string;
  env?: string;
  service?: string;
}

export interface PipelineConfig {
  _id?: string;
  id?: string;
  name?: string;
  enabled: boolean;
  inputType?: PipelineInputType;
  input?: PipelineInputType;
  source?: string;
  format?: PipelineParserType | string;
  description?: string;
  config?: PipelineConfigObject;
  parser?: PipelineParserConfig;
  mapping?: PipelineMappingConfig;
  defaults?: PipelineDefaultsConfig;
  publish?: PipelinePublishConfig;
  security?: PipelineSecurityConfig;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PipelineSavePayload {
  id?: string;
  name?: string;
  enabled: boolean;
  inputType: PipelineInputType;
  source: string;
  format: PipelineParserType;
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
