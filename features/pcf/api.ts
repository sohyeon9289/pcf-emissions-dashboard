/**
 * PCF 도메인 클라이언트 API 함수들.
 */
import { apiFetch } from '@/lib/api-client';
import type {
  ActivityCreateInput,
  ActivityFilterInput,
  ActivityTypeCreateInput,
  ActivityUpdateInput,
  CompanyCreateInput,
  EmissionFactorCreateInput,
  FactorVersionCreateInput,
  PostUpsertInput,
} from '@/lib/validation';

export type CompanyDto = {
  id: string;
  name: string;
  countryCode: string;
  description?: string | null;
  country?: { code: string; name: string };
};

export type ActivityTypeDto = {
  key: string;
  label: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  category?: string | null;
  defaultUnit: string;
  description?: string | null;
};

export type ActivityDto = {
  id: string;
  companyId: string;
  typeKey: string;
  date: string;
  description?: string | null;
  amount: number;
  unit: string;
  source?: string | null;
  type?: ActivityTypeDto;
  company?: CompanyDto;
};

export type FactorVersionDto = {
  id: string;
  factorId: string;
  version: number;
  value: number;
  validFrom: string;
  validTo: string | null;
  note?: string | null;
};

export type EmissionFactorDto = {
  id: string;
  typeKey: string;
  description: string;
  unit: string;
  numerator: string;
  denominator: string;
  source?: string | null;
  type?: ActivityTypeDto;
  versions: FactorVersionDto[];
};

export type PostDto = {
  id: string;
  title: string;
  resourceUid: string;
  dateTime: string;
  content: string;
};

export const fetchCompanies = () => apiFetch<CompanyDto[]>('/api/companies');
export const createCompany = (input: CompanyCreateInput) =>
  apiFetch<CompanyDto>('/api/companies', { method: 'POST', json: input });

export const fetchActivityTypes = () => apiFetch<ActivityTypeDto[]>('/api/activity-types');
export const createActivityType = (input: ActivityTypeCreateInput) =>
  apiFetch<ActivityTypeDto>('/api/activity-types', { method: 'POST', json: input });

export const createEmissionFactor = (input: EmissionFactorCreateInput) =>
  apiFetch<EmissionFactorDto>('/api/emission-factors', { method: 'POST', json: input });

export function buildActivityQuery(filter: ActivityFilterInput): string {
  const params = new URLSearchParams();
  if (filter.companyId) params.set('companyId', filter.companyId);
  if (filter.typeKey) params.set('typeKey', filter.typeKey);
  if (filter.scope) params.set('scope', filter.scope);
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  return params.toString();
}

export const fetchActivities = (filter: ActivityFilterInput = {}) =>
  apiFetch<ActivityDto[]>(`/api/activities${buildActivityQuery(filter) ? `?${buildActivityQuery(filter)}` : ''}`);

export const createActivity = (input: ActivityCreateInput) =>
  apiFetch<ActivityDto>('/api/activities', { method: 'POST', json: input });

export const updateActivity = (id: string, input: ActivityUpdateInput) =>
  apiFetch<ActivityDto>(`/api/activities/${id}`, { method: 'PATCH', json: input });

export const deleteActivity = (id: string) =>
  apiFetch<{ deleted: true }>(`/api/activities/${id}`, { method: 'DELETE' });

export const fetchEmissionFactors = () => apiFetch<EmissionFactorDto[]>('/api/emission-factors');

export const createFactorVersion = (
  factorId: string,
  input: Omit<FactorVersionCreateInput, 'factorId'>,
) =>
  apiFetch<FactorVersionDto>(`/api/emission-factors/${factorId}/versions`, {
    method: 'POST',
    json: input,
  });

export const fetchPosts = (filter: { resourceUid?: string; dateTime?: string } = {}) => {
  const params = new URLSearchParams();
  if (filter.resourceUid) params.set('resourceUid', filter.resourceUid);
  if (filter.dateTime) params.set('dateTime', filter.dateTime);
  const qs = params.toString();
  return apiFetch<PostDto[]>(`/api/posts${qs ? `?${qs}` : ''}`);
};

export const upsertPost = (input: PostUpsertInput) =>
  apiFetch<PostDto>('/api/posts', { method: 'POST', json: input });

export const deletePost = (id: string) =>
  apiFetch<{ deleted: true }>(`/api/posts/${id}`, { method: 'DELETE' });
