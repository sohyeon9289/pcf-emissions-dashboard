import { NextResponse } from 'next/server';

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: 헬스 체크
 *     responses:
 *       200:
 *         description: 정상
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', time: new Date().toISOString() });
}
