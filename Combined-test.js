import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    // Normal load testing scenario
    load_test: {
      executor: 'shared-iterations',
      vus: 60,
      iterations: 200,
      maxDuration: '1m',
      startTime: '10s',
      gracefulStop: '5s',
      env: { TEST_TYPE: 'load' },
      tags: { test_type: 'load' }
    },
    
    // Spike testing scenario (starts after 2 minutes)
    spike_test: {
      executor: 'ramping-vus',
      startTime: '1m',  // Starts after load test
      stages: [
        { duration: '30s', target: 500 },  // Rapid spike
        { duration: '1m', target: 0 },      // Quick ramp-down
      ],
      gracefulStop: '0s',
      env: { TEST_TYPE: 'spike' },
      tags: { test_type: 'spike' }
    }
  },

  // Cloud configuration
  cloud: {
    projectID: "3639548",
    name: "combined-load-spike-test"
  },

  // Common thresholds
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Less than 1% errors
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    'http_req_duration{test_type:load}': ['p(90)<300'],  // Stricter for normal load
    'http_req_duration{test_type:spike}': ['p(95)<800']  // More lenient during spikes
  }
};

export default function () {
  // Main request
  const response = http.get('https://quickpizza.grafana.com');
  
  // Additional steps can be added conditionally
  if (__ENV.TEST_TYPE === 'load') {
    // Normal load operations
    http.get('https://quickpizza.grafana.com/menu');
    sleep(0.5);
  } 
  else if (__ENV.TEST_TYPE === 'spike') {
    // Critical path only during spike
    http.get('https://quickpizza.grafana.com/checkout');
  }
  
  sleep(1);
}