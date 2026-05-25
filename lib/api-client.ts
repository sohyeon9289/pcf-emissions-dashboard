/**
 * 클라이언트 측 API 헬퍼. fetch 래퍼.
 * 표준 에러 포맷 {code, message, fieldErrors?}를 ApiClientError 로 throw.
 */
import type { ApiError } from './validation';

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: ApiError,
  ) {
    super(payload.message ?? 'API 요청 실패');
    this.name = 'ApiClientError';
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const res = await fetch(path, { ...init, headers, body });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : (await res.text() as unknown);
  if (!res.ok) {
    const err: ApiError =
      isJson && payload && typeof payload === 'object'
        ? (payload as ApiError)
        : { code: 'UNKNOWN', message: typeof payload === 'string' ? payload : 'API 요청 실패' };
    throw new ApiClientError(res.status, err);
  }
  return payload as T;
}
