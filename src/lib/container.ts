import 'reflect-metadata';
import { Container } from 'small-type-dependency-injection';

import { HttpClient } from '$services/api/http-client';
import { LogsApi } from '$services/api/logs-api';
import { PipelineApi } from '$services/api/pipeline-api';

/**
 * Shared application services.
 *
 * The DI container is kept available for future services, but the HTTP/API
 * services are created explicitly because the browser build does not always
 * preserve constructor metadata in a reliable way.
 */
export const container = new Container();

export const httpClient = new HttpClient();
export const pipelineApi = new PipelineApi(httpClient);
export const logsApi = new LogsApi(httpClient);

container.bindValue(HttpClient, httpClient);
container.bindValue(PipelineApi, pipelineApi);
container.bindValue(LogsApi, logsApi);
