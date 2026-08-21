import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const homepageDuration = new Trend('homepage_duration');
export const apiLeaderboardDuration = new Trend('api_leaderboard_duration');
export const apiDailyDuration = new Trend('api_daily_duration');
export const apiSudokuDuration = new Trend('api_sudoku_duration');

// Load configurations for 100, 500, and 1000 concurrent VUs
export const options = {
  scenarios: {
    // Scenario 1: Moderate Traffic Baseline (100 VUs)
    moderate_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // Scenario 2: High Traffic Spike (500 VUs)
    high_spike: {
      executor: 'ramping-vus',
      startTime: '2m',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 250 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
    // Scenario 3: Stress Peak (1000 VUs)
    stress_peak: {
      executor: 'ramping-vus',
      startTime: '4m30s',
      startVUs: 0,
      stages: [
        { duration: '45s', target: 500 },
        { duration: '1m30s', target: 1000 },
        { duration: '45s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // error rate < 1%
    http_req_duration: ['p(95)<300', 'p(99)<800'], // 95% under 300ms, 99% under 800ms
    errors: ['rate<0.01'],
  },
};

const BASE_WEB_URL = __ENV.BASE_WEB_URL || 'http://localhost:3000';
const BASE_API_URL = __ENV.BASE_API_URL || 'http://localhost:3001';

export default function () {
  // 1. Browse Homepage (SSR & Static Assets)
  group('Homepage Visitor Flow', () => {
    const res = http.get(`${BASE_WEB_URL}/en`);
    const success = check(res, {
      'homepage status 200': (r) => r.status === 200,
      'homepage has H1': (r) => r.body.includes('<h1') || r.body.includes('Sudoku'),
    });
    errorRate.add(!success);
    homepageDuration.add(res.timings.duration);
    sleep(1);
  });

  // 2. Play Sudoku Solo Session Start
  group('Game Session Flow', () => {
    const res = http.get(`${BASE_API_URL}/sudoku/start?difficulty=EASY`);
    const success = check(res, {
      'sudoku start status 200': (r) => r.status === 200,
      'sudoku returns initialBoard': (r) => {
        try {
          const body = JSON.parse(r.body);
          return !!body.initialBoard && body.solvedBoard === undefined; // Anti-cheat verification
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!success);
    apiSudokuDuration.add(res.timings.duration);
    sleep(2);
  });

  // 3. Daily Challenge Lookup
  group('Daily Challenge Flow', () => {
    const res = http.get(`${BASE_API_URL}/daily/today`);
    const success = check(res, {
      'daily status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
    apiDailyDuration.add(res.timings.duration);
    sleep(1);
  });

  // 4. Period & Global Leaderboard
  group('Leaderboard Caching Flow', () => {
    const resGlobal = http.get(`${BASE_API_URL}/leaderboard?limit=50`);
    const resWeekly = http.get(`${BASE_API_URL}/leaderboard/period/weekly?limit=50`);
    const success = check(resGlobal, {
      'global leaderboard 200': (r) => r.status === 200,
    }) && check(resWeekly, {
      'weekly leaderboard 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
    apiLeaderboardDuration.add(resGlobal.timings.duration + resWeekly.timings.duration);
    sleep(1);
  });

  // 5. Lightweight Analytics Fire-and-Forget
  group('Analytics Tracking Flow', () => {
    const payload = JSON.stringify({
      eventType: 'page_view',
      page: '/en/play',
      sessionId: 'k6-session-' + __VU,
    });
    const headers = { 'Content-Type': 'application/json' };
    const res = http.post(`${BASE_API_URL}/analytics/track`, payload, { headers });
    const success = check(res, {
      'analytics track 201 or 200': (r) => r.status === 200 || r.status === 201,
    });
    errorRate.add(!success);
    sleep(1);
  });
}
