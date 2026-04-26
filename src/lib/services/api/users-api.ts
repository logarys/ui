import { environment } from '$lib/config/environment';
import type { CurrentUser } from '$services/auth/auth.store';
import { HttpClient } from './http-client';
import { createApiRequestError } from './api-error';

export interface User extends CurrentUser {
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  isEnabled: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  isAdmin?: boolean;
  isEnabled?: boolean;
}

export class UsersApi {
  constructor(private readonly httpClient: HttpClient) {}

  async list(): Promise<User[]> {
    const response = await this.httpClient.get<User[]>(`${environment.apiUrl}/users`);
    if (!response.isOk() || !response.data) throw createApiRequestError(response, 'Unable to load users');
    return response.data;
  }

  async create(payload: CreateUserPayload): Promise<User> {
    const response = await this.httpClient.post<User>(`${environment.apiUrl}/users`, payload);
    if (!response.isOk() || !response.data) throw createApiRequestError(response, 'Unable to create user');
    return response.data;
  }

  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    const response = await this.httpClient.patch<User>(`${environment.apiUrl}/users/${encodeURIComponent(id)}`, payload);
    if (!response.isOk() || !response.data) throw createApiRequestError(response, 'Unable to update user');
    return response.data;
  }

  async disable(id: string): Promise<User> {
    const response = await this.httpClient.patch<User>(`${environment.apiUrl}/users/${encodeURIComponent(id)}/disable`);
    if (!response.isOk() || !response.data) throw createApiRequestError(response, 'Unable to disable user');
    return response.data;
  }

  async me(): Promise<User> {
    const response = await this.httpClient.get<User>(`${environment.apiUrl}/users/me`);
    if (!response.isOk() || !response.data) throw createApiRequestError(response, 'Unable to load profile');
    return response.data;
  }

  async updateMe(payload: UpdateUserPayload): Promise<User> {
    const response = await this.httpClient.patch<User>(`${environment.apiUrl}/users/me`, payload);
    if (!response.isOk() || !response.data) throw createApiRequestError(response, 'Unable to update profile');
    return response.data;
  }
}
