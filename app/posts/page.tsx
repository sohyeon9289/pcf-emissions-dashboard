'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, RotateCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCompanies, usePosts } from '@/features/pcf/queries';
import { useDeletePost, useUpsertPost } from '@/features/pcf/mutations';
import { PostUpsertSchema, type PostUpsertInput } from '@/lib/validation';
import { useFilterUrl } from '@/features/filters/useFilterUrl';
import type { PostDto } from '@/features/pcf/api';

const MONTHS = Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, '0')}`);

export default function PostsPage() {
  const { filter } = useFilterUrl();
  const companies = useCompanies();
  const postsQuery = usePosts({ resourceUid: filter.companyId });
  const upsert = useUpsertPost(() => setEditing(null));
  const del = useDeletePost();
  const [editing, setEditing] = React.useState<PostDto | 'new' | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">게시물</h1>
          <p className="text-sm text-muted-foreground">
            회사 + 월(YYYY-MM)에 태깅하는 운영 메모/리포트. 저장 시 약 15% 확률로 실패(시뮬레이션) →
            재시도 UX 시연.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-3 w-3" /> 새 게시물
        </Button>
      </div>

      {editing ? (
        <PostForm
          post={editing === 'new' ? null : editing}
          loading={upsert.isPending}
          onSubmit={(input) => upsert.mutate(input)}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>목록</CardTitle>
          <CardDescription>
            {filter.companyId
              ? `회사 필터 적용 (${companies.data?.find((c) => c.id === filter.companyId)?.name})`
              : '전체 회사'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {postsQuery.error ? (
            <ErrorState
              description={
                postsQuery.error instanceof Error ? postsQuery.error.message : String(postsQuery.error)
              }
              onRetry={() => postsQuery.refetch()}
            />
          ) : postsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : postsQuery.data && postsQuery.data.length === 0 ? (
            <EmptyState description="게시물이 없습니다." />
          ) : (
            <ul className="flex flex-col gap-2">
              {postsQuery.data?.map((p) => {
                const c = companies.data?.find((x) => x.id === p.resourceUid);
                return (
                  <li
                    key={p.id}
                    className="rounded-md border border-border bg-card p-3 hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="primary">{p.dateTime}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {c?.name ?? p.resourceUid}
                          </span>
                        </div>
                        <h3 className="mt-1 truncate text-sm font-semibold">{p.title}</h3>
                        <p className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                          {p.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="수정"
                          onClick={() => setEditing(p)}
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="삭제"
                          loading={del.isPending && del.variables === p.id}
                          onClick={() => {
                            if (confirm('이 게시물을 삭제할까요?')) del.mutate(p.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PostForm({
  post,
  loading,
  onSubmit,
  onCancel,
}: {
  post: PostDto | null;
  loading: boolean;
  onSubmit: (input: PostUpsertInput) => void;
  onCancel: () => void;
}) {
  const companies = useCompanies();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostUpsertInput>({
    resolver: zodResolver(PostUpsertSchema),
    defaultValues: {
      id: post?.id,
      title: post?.title ?? '',
      resourceUid: post?.resourceUid ?? '',
      dateTime: post?.dateTime ?? MONTHS[0],
      content: post?.content ?? '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post ? '게시물 수정' : '새 게시물'}</CardTitle>
        <CardDescription>
          저장 시 일시적 실패가 발생할 수 있습니다. 그대로 다시 저장 버튼을 누르면 재시도됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input type="hidden" {...register('id')} />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label required>제목</Label>
            <Input {...register('title')} error={!!errors.title} />
            <FieldError message={errors.title?.message} />
          </div>
          <div className="flex flex-col gap-1">
            <Label required>회사</Label>
            <Select {...register('resourceUid')} error={!!errors.resourceUid}>
              <option value="">선택…</option>
              {companies.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.resourceUid?.message} />
          </div>
          <div className="flex flex-col gap-1">
            <Label required>월</Label>
            <Select {...register('dateTime')} error={!!errors.dateTime}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            <FieldError message={errors.dateTime?.message} />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label>내용</Label>
            <Textarea rows={4} {...register('content')} error={!!errors.content} />
            <FieldError message={errors.content?.message} />
          </div>
          <div className="flex items-center justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              취소
            </Button>
            <Button type="submit" loading={loading}>
              저장
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
