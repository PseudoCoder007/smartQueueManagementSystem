import { api, jsonBody } from './client';
import type { DailyStats, OverviewStats, PriorityType, QueueState, ServiceQueue, Token } from '../types/models';

export const userApi = {
  services: (token: string) => api<ServiceQueue[]>('/services', {}, token),
  service: (id: string, token: string) => api<ServiceQueue>(`/services/${id}`, {}, token),
  createToken: (serviceId: string, priorityType: PriorityType, token: string) =>
    api<Token>('/tokens', { method: 'POST', ...jsonBody({ serviceId, priorityType }) }, token),
  myTokens: (token: string) => api<Token[]>('/tokens/my', {}, token),
  token: (id: string, token: string) => api<Token>(`/tokens/${id}`, {}, token),
  cancel: (id: string, token: string) => api<Token>(`/tokens/${id}/cancel`, { method: 'DELETE' }, token),
  activeToken: (serviceId: string, token: string) =>
    api<Token | undefined>(`/tokens/active?serviceId=${serviceId}`, {}, token)
};

export const adminApi = {
  services: (token: string) => api<ServiceQueue[]>('/admin/services', {}, token),
  saveService: (data: Partial<ServiceQueue>, token: string, id?: string) =>
    api<ServiceQueue>(id ? `/admin/services/${id}` : '/admin/services', {
      method: id ? 'PUT' : 'POST',
      ...jsonBody(data)
    }, token),
  activate: (id: string, token: string) => api<ServiceQueue>(`/admin/services/${id}/activate`, { method: 'POST' }, token),
  deactivate: (id: string, token: string) =>
    api<ServiceQueue>(`/admin/services/${id}/deactivate`, { method: 'POST' }, token),
  queue: (serviceId: string, token: string) => api<QueueState>(`/admin/queues/${serviceId}`, {}, token),
  open: (serviceId: string, token: string) => api<QueueState>(`/admin/queues/${serviceId}/open`, { method: 'POST' }, token),
  close: (serviceId: string, token: string) => api<QueueState>(`/admin/queues/${serviceId}/close`, { method: 'POST' }, token),
  next: (serviceId: string, token: string) => api<Token>(`/admin/queues/${serviceId}/next`, { method: 'POST' }, token),
  action: (tokenId: string, action: 'call' | 'complete' | 'skip' | 'recall', token: string) =>
    api<Token>(`/admin/tokens/${tokenId}/${action}`, { method: 'POST' }, token),
  priority: (tokenId: string, priorityType: PriorityType, reason: string, token: string) =>
    api<Token>(`/admin/tokens/${tokenId}/priority`, { method: 'POST', ...jsonBody({ priorityType, reason }) }, token),
  overview: (token: string) => api<OverviewStats>('/admin/stats/overview', {}, token),
  daily: (token: string) => api<DailyStats>('/admin/stats/daily', {}, token)
};
