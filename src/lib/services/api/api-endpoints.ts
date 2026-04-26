import { environment } from '$lib/config/environment';

export const apiEndpoints = {
  pipelines: [
    '/pipelines',
    '/api/pipelines',
    '/config-management/pipelines',
    '/api/config-management/pipelines',
    '/config-management/pipeline',
    '/api/config-management/pipeline',
    '/configuration/pipelines',
    '/api/configuration/pipelines',
    '/pipeline-configs',
    '/api/pipeline-configs',
    '/pipeline-config',
    '/api/pipeline-config',
    '/config/pipelines',
    '/api/config/pipelines',
    '/config/pipeline',
    '/api/config/pipeline',
    '/pipeline',
    '/api/pipeline'
  ],
  logs: [
    '/logs',
    '/api/logs',
    '/log-records',
    '/api/log-records',
    '/storage/logs',
    '/api/storage/logs',
    '/records',
    '/api/records',
    '/search/logs',
    '/api/search/logs'
  ]
} as const;

export function apiUrl(path: string): string {
  return `${environment.apiUrl}${path}`;
}
