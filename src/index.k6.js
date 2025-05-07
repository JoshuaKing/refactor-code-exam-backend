import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
    // iterations: 100,
    // duration: '10s',
    // vus: 10,
    // preAllocatedVUs: 200,
    // stages: [
    //     { duration: '5s', target: 10, vus: 10 },
    //     { duration: '10s', target: 100, vus: 100 },
    //     { duration: '5s', target: 200, vus: 200 },
    // ],
    scenarios: {
        low_load: {
            executor: 'shared-iterations',
            vus: 100,
            iterations: 1000,
            maxDuration: '10s',
        },
        high_load: {
            executor: 'shared-iterations',
            vus: 300,
            iterations: 10000,
            startTime: '10s',
            maxDuration: '60s',
        }
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: [ { threshold: 'p(95)<2000', abortOnFail: true } ]
    }
};

export default function () {

    let res = http.get('http://localhost:3000/?state=Qld')
    check(res, {
        'success qld': (r) => r.status === 200,
        'content qld': (r) => r.body.length > 2,
    })


    sleep(0.3)

}