/**
 * 낙관적 업데이트 + 롤백을 지원하는 mutation hooks.
 * 영문 과제의 Fake API 실패 시나리오를 사용자에게 자연스럽게 노출한다.
 */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createActivity,
  createActivityType,
  createCompany,
  createEmissionFactor,
  createFactorVersion,
  deleteActivity,
  deletePost,
  updateActivity,
  upsertPost,
  type ActivityDto,
  type ActivityTypeDto,
  type CompanyDto,
  type EmissionFactorDto,
  type FactorVersionDto,
  type PostDto,
} from './api';
import { qk } from './queries';
import type {
  ActivityCreateInput,
  ActivityTypeCreateInput,
  ActivityUpdateInput,
  CompanyCreateInput,
  EmissionFactorCreateInput,
  FactorVersionCreateInput,
  PostUpsertInput,
} from '@/lib/validation';
import { useToast } from '@/components/ui/Toast';

function invalidateActivities(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['activities'] });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: ActivityCreateInput) => createActivity(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['activities'] });
      const tempId = `temp-${Math.random().toString(36).slice(2)}`;
      const optimistic: ActivityDto = {
        id: tempId,
        companyId: input.companyId,
        typeKey: input.typeKey,
        date: input.date,
        description: input.description ?? null,
        amount: input.amount,
        unit: input.unit,
        source: input.source ?? null,
      };
      const snapshots: Array<[readonly unknown[], ActivityDto[] | undefined]> = [];
      qc.getQueriesData<ActivityDto[]>({ queryKey: ['activities'] }).forEach(([key, value]) => {
        snapshots.push([key, value]);
        qc.setQueryData<ActivityDto[]>(key, (prev) => [...(prev ?? []), optimistic]);
      });
      return { snapshots, tempId };
    },
    onError: (err, _input, ctx) => {
      ctx?.snapshots.forEach(([key, value]) => qc.setQueryData(key, value));
      toast.push({
        tone: 'error',
        title: '활동 저장 실패',
        description: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    },
    onSuccess: () => {
      toast.push({ tone: 'success', title: '활동 데이터가 저장되었습니다.' });
    },
    onSettled: () => invalidateActivities(qc),
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActivityUpdateInput }) =>
      updateActivity(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: ['activities'] });
      const snapshots: Array<[readonly unknown[], ActivityDto[] | undefined]> = [];
      qc.getQueriesData<ActivityDto[]>({ queryKey: ['activities'] }).forEach(([key, value]) => {
        snapshots.push([key, value]);
        qc.setQueryData<ActivityDto[]>(key, (prev) =>
          (prev ?? []).map((a) => (a.id === id ? { ...a, ...input } as ActivityDto : a)),
        );
      });
      return { snapshots };
    },
    onError: (err, _v, ctx) => {
      ctx?.snapshots.forEach(([key, value]) => qc.setQueryData(key, value));
      toast.push({
        tone: 'error',
        title: '활동 수정 실패',
        description: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    },
    onSuccess: () => toast.push({ tone: 'success', title: '활동이 수정되었습니다.' }),
    onSettled: () => invalidateActivities(qc),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['activities'] });
      const snapshots: Array<[readonly unknown[], ActivityDto[] | undefined]> = [];
      qc.getQueriesData<ActivityDto[]>({ queryKey: ['activities'] }).forEach(([key, value]) => {
        snapshots.push([key, value]);
        qc.setQueryData<ActivityDto[]>(key, (prev) => (prev ?? []).filter((a) => a.id !== id));
      });
      return { snapshots };
    },
    onError: (err, _v, ctx) => {
      ctx?.snapshots.forEach(([key, value]) => qc.setQueryData(key, value));
      toast.push({
        tone: 'error',
        title: '활동 삭제 실패',
        description: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    },
    onSuccess: () => toast.push({ tone: 'success', title: '활동이 삭제되었습니다.' }),
    onSettled: () => invalidateActivities(qc),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<CompanyDto, Error, CompanyCreateInput>({
    mutationFn: (input) => createCompany(input),
    onError: (err) =>
      toast.push({ tone: 'error', title: '회사 추가 실패', description: err.message }),
    onSuccess: () => {
      toast.push({ tone: 'success', title: '회사가 추가되었습니다.' });
      qc.invalidateQueries({ queryKey: qk.companies });
    },
  });
}

export function useCreateActivityType() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<ActivityTypeDto, Error, ActivityTypeCreateInput>({
    mutationFn: (input) => createActivityType(input),
    onError: (err) =>
      toast.push({ tone: 'error', title: '활동 유형 추가 실패', description: err.message }),
    onSuccess: () => {
      toast.push({ tone: 'success', title: '활동 유형이 추가되었습니다.' });
      qc.invalidateQueries({ queryKey: qk.activityTypes });
    },
  });
}

export function useCreateEmissionFactor() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<EmissionFactorDto, Error, EmissionFactorCreateInput>({
    mutationFn: (input) => createEmissionFactor(input),
    onError: (err) =>
      toast.push({ tone: 'error', title: '배출계수 추가 실패', description: err.message }),
    onSuccess: () => {
      toast.push({ tone: 'success', title: '배출계수가 추가되었습니다.' });
      qc.invalidateQueries({ queryKey: qk.emissionFactors });
    },
  });
}

export function useCreateFactorVersion() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<
    FactorVersionDto,
    Error,
    { factorId: string; input: Omit<FactorVersionCreateInput, 'factorId'> }
  >({
    mutationFn: ({ factorId, input }) => createFactorVersion(factorId, input),
    onError: (err) =>
      toast.push({
        tone: 'error',
        title: '버전 등록 실패',
        description: err.message,
      }),
    onSuccess: () => {
      toast.push({ tone: 'success', title: '새 버전이 등록되었습니다.' });
      qc.invalidateQueries({ queryKey: qk.emissionFactors });
    },
  });
}

export function useUpsertPost(onAfterSuccess?: (p: PostDto) => void) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: PostUpsertInput) => upsertPost(input),
    onError: (err) =>
      toast.push({
        tone: 'error',
        title: '게시물 저장 실패',
        description: err instanceof Error ? err.message : '알 수 없는 오류',
      }),
    onSuccess: (p) => {
      toast.push({ tone: 'success', title: '게시물이 저장되었습니다.' });
      qc.invalidateQueries({ queryKey: ['posts'] });
      onAfterSuccess?.(p);
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onError: (err) =>
      toast.push({
        tone: 'error',
        title: '게시물 삭제 실패',
        description: err instanceof Error ? err.message : '알 수 없는 오류',
      }),
    onSuccess: () => {
      toast.push({ tone: 'success', title: '게시물이 삭제되었습니다.' });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
