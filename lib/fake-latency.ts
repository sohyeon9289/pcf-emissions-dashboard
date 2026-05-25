/**
 * Fake latency / failure simulator (영문 HanaLoop 과제 요구사항).
 *
 * write 요청에 200~800ms 임의 지연과 ~15% 실패를 시뮬레이션해서
 * 클라이언트의 로딩/낙관적 업데이트/롤백 UX를 실제로 보여준다.
 *
 * 환경변수로 토글 가능 (.env.example 참고):
 *   NEXT_PUBLIC_SIMULATE_LATENCY=1
 *   NEXT_PUBLIC_SIMULATE_FAILURE_RATE=0.15
 *   NEXT_PUBLIC_SIMULATE_LATENCY_MIN_MS=200
 *   NEXT_PUBLIC_SIMULATE_LATENCY_MAX_MS=800
 */

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function envFlag(name: string, fallback = '0') {
  return (process.env[name] ?? fallback) !== '0' && (process.env[name] ?? fallback) !== '';
}
function envNumber(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export class SimulatedFailureError extends Error {
  constructor(public readonly opName: string) {
    super(`(시뮬레이션) ${opName} 처리 중 일시적 오류가 발생했습니다. 다시 시도해주세요.`);
    this.name = 'SimulatedFailureError';
  }
}

export type FakeLatencyOptions = {
  /** failure 시뮬레이션 적용 여부 (기본: write 작업에만 켬) */
  mayFail?: boolean;
  /** 사람이 읽을 수 있는 작업명 (에러 메시지에 사용) */
  opName?: string;
};

export async function withFakeLatency<T>(
  task: () => Promise<T> | T,
  options: FakeLatencyOptions = {},
): Promise<T> {
  const latencyOn = envFlag('NEXT_PUBLIC_SIMULATE_LATENCY', '1');
  if (latencyOn) {
    const min = envNumber('NEXT_PUBLIC_SIMULATE_LATENCY_MIN_MS', 200);
    const max = envNumber('NEXT_PUBLIC_SIMULATE_LATENCY_MAX_MS', 800);
    const ms = Math.floor(min + Math.random() * Math.max(0, max - min));
    await delay(ms);
  }
  if (options.mayFail) {
    const rate = envNumber('NEXT_PUBLIC_SIMULATE_FAILURE_RATE', 0.15);
    if (Math.random() < rate) {
      throw new SimulatedFailureError(options.opName ?? '요청');
    }
  }
  return task();
}
