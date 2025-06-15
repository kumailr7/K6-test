// Production-Ready K6 Load Testing Script for API Endpoints with SLA and SLO Compliance
import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Environment config
const BASE_URL = __ENV.NGROK_URL || 'http://localhost:3055';

// SLA Configuration (Business Requirements)
const SLA = {
  MAX_ERROR_RATE: 0.01,    // 1%
  MAX_P95_LATENCY: 500,    // ms
  MIN_SUCCESS_RATE: 0.99   // 99%
};

// SLO Configuration (Engineering Targets)
const SLO = {
  ERROR_RATE: SLA.MAX_ERROR_RATE * 0.8,      // 20% stricter than SLA
  P95_LATENCY: SLA.MAX_P95_LATENCY * 0.9     // 10% stricter than SLA
};

export const options = {
  insecureSkipTLSVerify: true,  // Global TLS skip verification
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 VUs
    { duration: '1m', target: 40 },  // Ramp up to 40 VUs
    { duration: '30s', target: 0 }
  ],
  thresholds: {
    // SLIs with SLO thresholds
    http_req_failed: [`rate<${SLO.ERROR_RATE}`],        // SLI: Error rate
    http_req_duration: [`p(95)<${SLO.P95_LATENCY}`],    // SLI: Latency
    
    // Additional SLIs for monitoring
    http_reqs: [`count>1000`],                          // SLI: Throughput
    iteration_duration: ['p(90)<2000']                  // SLI: Test health
  }
};

export default function () {
  // Test GET endpoint (SLI measurement)
  const getRes = http.get(`${BASE_URL}/api/hello`);
  check(getRes, {
    'GET status is 200': (r) => r.status === 200,                     // SLI
    'GET response within SLA': (r) => r.timings.duration < SLA.MAX_P95_LATENCY  // SLA check
  });

  // Test POST endpoint (SLI measurement)
  const postRes = http.post(
    `${BASE_URL}/api/users`,
    JSON.stringify({ name: 'K6 User' }),
    { 
      headers: { 'Content-Type': 'application/json' }
    }
  );
  check(postRes, {
    'POST status is 201': (r) => r.status === 201                     // SLI
  });

  sleep(1);
}

// SLA Compliance Report
export function handleSummary(data) {
  const errorRate = data.metrics.http_req_failed.values.rate;
  const latency = data.metrics.http_req_duration.values['p(95)'];
  
  const slaStatus = {
    errorRate: errorRate <= SLA.MAX_ERROR_RATE ? 'PASS' : 'FAIL',
    latency: latency <= SLA.MAX_P95_LATENCY ? 'PASS' : 'FAIL'
  };
  
  return {
    'stdout': htmlReport(data),
    'sla-report.json': JSON.stringify({ slaStatus, metrics: data.metrics }),
    "k6-report.html": htmlReport(data)
  };
}
