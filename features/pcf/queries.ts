/**
 * TanStack Query keys + hooks.
 * - 키에 filter 를 포함해 자동 무효화/캐싱.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchActivities,
  fetchActivityTypes,
  fetchCompanies,
  fetchEmissionFactors,
  fetchPosts,
  type ActivityDto,
  type ActivityTypeDto,
  type CompanyDto,
  type EmissionFactorDto,
  type PostDto,
} from './api';
import type { ActivityFilterInput } from '@/lib/validation';

export const qk = {
  companies: ['companies'] as const,
  activityTypes: ['activity-types'] as const,
  activities: (filter: ActivityFilterInput) => ['activities', filter] as const,
  emissionFactors: ['emission-factors'] as const,
  posts: (filter: { resourceUid?: string; dateTime?: string }) => ['posts', filter] as const,
};

export function useCompanies() {
  return useQuery<CompanyDto[]>({ queryKey: qk.companies, queryFn: fetchCompanies });
}
export function useActivityTypes() {
  return useQuery<ActivityTypeDto[]>({ queryKey: qk.activityTypes, queryFn: fetchActivityTypes });
}
export function useActivities(filter: ActivityFilterInput = {}) {
  return useQuery<ActivityDto[]>({
    queryKey: qk.activities(filter),
    queryFn: () => fetchActivities(filter),
  });
}
export function useEmissionFactors() {
  return useQuery<EmissionFactorDto[]>({
    queryKey: qk.emissionFactors,
    queryFn: fetchEmissionFactors,
  });
}
export function usePosts(filter: { resourceUid?: string; dateTime?: string } = {}) {
  return useQuery<PostDto[]>({ queryKey: qk.posts(filter), queryFn: () => fetchPosts(filter) });
}
