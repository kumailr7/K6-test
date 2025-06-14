// test-api.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up to 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
  },
};

export default function () {
  // Test GET endpoint
  const getRes = http.get('http://localhost:3055/api/hello');
  check(getRes, {
    'GET status is 200': (r) => r.status === 200,
    'GET has message': (r) => JSON.parse(r.body).message.includes('K6'),
  });

  // Test POST endpoint
  const postRes = http.post(
    'http://localhost:3055/api/users',
    JSON.stringify({ name: 'K6 User' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(postRes, {
    'POST status is 201': (r) => r.status === 201,
    'POST returns user ID': (r) => JSON.parse(r.body).id === 1,
  });

  sleep(1); // Simulate user think time
}