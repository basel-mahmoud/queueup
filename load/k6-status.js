// k6 load test for QueueUp's hottest edge path: customer status polling.
// Run: k6 run -e BASE=https://<ref>.supabase.co/functions/v1 -e TOKEN=<join_token> load/k6-status.js
//
// SLO: p95 < 600ms and < 1% errors under sustained polling load.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE;
const TOKEN = __ENV.TOKEN;

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 40 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<600'],
  },
};

export default function () {
  const res = http.post(`${BASE}/entry-status`, JSON.stringify({ join_token: TOKEN }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(2); // mirrors the 5s client poll, slightly faster to stress
}
