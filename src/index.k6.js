import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
    // iterations: 100,
    // duration: '10s',
    // vus: 10,
    preAllocatedVus: 100,
    // stages: [
    //     { duration: '5s', target: 100 },
    //     { duration: '5s', target: 100 },
    //     // { duration: '10s', target: 1000, vus: 1000, iterations: 1000 },
    //     // { duration: '10s', target: 1000, vus: 1000, iterations: 10000 },
    //     // { duration: '20s', target: 1000, vus: 1000, iterations: 100000 },
    // ],
    scenarios: {
        // low_load: {
        //     executor: 'shared-iterations',
        //     vus: 100,
        //     iterations: 1000,
        //     maxDuration: '10s',
        // },
        // high_load: {
        //     executor: 'shared-iterations',
        //     vus: 1000,
        //     iterations: 100000,
        //     // startTime: '10s',
        //     maxDuration: '60s',
        // }
        breakpoint_concurrent_vus: {
            executor: 'ramping-arrival-rate',
            exec: 'breakpoint_concurrent_vus',
            preAllocatedVUs: 10000,
            timeUnit: '1s',
            startRate: 1000,
            maxVUs: 10000,
            stages: [
                { duration: '30s', target: 1000*2 },
                { duration: '60s', target: 1000*4 },
                { duration: '120s', target: 1000*8 },
                { duration: '120s', target: 1000*16 },
                { duration: '120s', target: 1000*32 },
                { duration: '600s', target: 1000*1024 },
            ],
            startTime: '10m'
        },
        breakpoint_concurrent_vus_lookup: {
            executor: 'ramping-arrival-rate',
            exec: 'breakpoint_concurrent_vus_lookup',
            preAllocatedVUs: 10000,
            timeUnit: '1s',
            startRate: 100,
            maxVUs: 10000,
            stages: [
                { duration: '60s', target: 1000 },
                { duration: '60s', target: 1000*2 },
                { duration: '120s', target: 1000*8 },
                { duration: '120s', target: 1000*16 },
                { duration: '120s', target: 1000*32 },
                { duration: '600s', target: 1000*1024 },
            ]
        }
    },
    thresholds: {
        http_req_failed: [ { threshold: 'rate<0.01', abortOnFail: true }],
        http_req_duration: [ { threshold: 'p(95)<1000', abortOnFail: true } ]
    }
};

export function breakpoint_concurrent_vus() {
    const res = http.get('http://localhost:3000/state/Qld')
    check(res, {
        'success qld': (r) => r.status === 200,
        'content qld': (r) => r.body && r.body.length > 2,
    })
}
export function breakpoint_concurrent_vus_lookup() {
    const res = http.get('http://localhost:3000/warning/IDQ10090')
    check(res, {
        'success IDQ10090': (r) => r.status === 200,
        'content IDQ10090': (r) => r.body && r.body.length > 2,
    })
}