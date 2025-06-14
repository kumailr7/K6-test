// test-api.js
import http from 'k6/http';
import { check, sleep } from 'k6';

// Use ngrok URL if available, otherwise fallback to localhost
const BASE_URL = __ENV.NGROK_URL || 'http://localhost:3055';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up to 20 users 
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    //  SLA for error rate and response time
    // SLO for error rate and response time
    // SLI for error rate and response time
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
  },
};

export default function () {
  // Test GET endpoint
  const getRes = http.get(`${BASE_URL}/api/hello`);
  check(getRes, {
    'GET status is 200': (r) => r.status === 200,
    'GET has message': (r) => JSON.parse(r.body).message.includes('K6'),
  });

  // Test POST endpoint
  const postRes = http.post(
    `${BASE_URL}/api/users`,
    JSON.stringify({ name: 'K6 User' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(postRes, {
    'POST status is 201': (r) => r.status === 201,
    'POST returns user ID': (r) => JSON.parse(r.body).id === 1,
  });

  sleep(1); // Simulate user think time
}