import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { SimulatedFailureError } from './fake-latency';
import { UnitMismatchError } from './units';
import { zodToApiError, type ApiError } from './validation';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function err(code: string, message: string, status = 400, extra: Partial<ApiError> = {}) {
  const body: ApiError = { code, message, ...extra };
  return NextResponse.json(body, { status });
}

export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json(zodToApiError(e), { status: 400 });
  }
  if (e instanceof SimulatedFailureError) {
    return err('SIMULATED_FAILURE', e.message, 503);
  }
  if (e instanceof UnitMismatchError) {
    return err('UNIT_MISMATCH', e.message, 422);
  }
  console.error('[API] unexpected error', e);
  return err('INTERNAL_ERROR', e instanceof Error ? e.message : '서버 오류', 500);
}
