# Notes
## Config/TS Config/Package JSON
- no node/npm/engine version
- old TS version - 4.3.5 instead of latest (5.8.3)
- old JS target version (ES5 instead of >=ES6)
- commonjs instead of ESM (tree shaking, standard/language)  - use es6 and ts-node-esm
  - for v20+ node - use node --loader ts-node/esm x.ts or use tsc --noEmit && tsx x.ts
## Styling and Code Smells
- Using || instead of ?? - can be different under some circumstances
- Unused function 'getWarning'
- Using deprecated 'download' instead of 'downloadTo'
- Using == instead of ===
- Using a loop for 1 item (particularly when value is already known)
- Inaccessible code - client.close() in Downloader - use finally{} or with resource
  - Causes memory leek
- Public class methods that are class-specific and should be private
- 'any' type (for floodWarning constructor param)
- Some methods/functions have return type specified directly, others default
- logger behaves differently in prod - try to keep identical where possible
- GET to / with param instead of REST standard of /warnings/state/qld
## Testing/Coverage
- Jest for TS - needs transpiling/jest-ts
- Should mock out external ftp server (like expect()ing a specific file to be present)
- Missing tests for several key files
## Architecture
- No NestJS
  - currently okay but for larger projects and development
  - good to have more rigid standards
  - split up controllers/endpoints
- No HTTPS hosting?
- What happens if file is large? Or many files downloaded?
## CICD / Git
- git history? - commit message/branch etc
- checking coverage/styling/code smells automatically with tooling like SonarCloud?
- non-checking of project libraries/types
- security of project - auto scanning and package checking
  - npm install - 28 vulnerabilities (3 low, 10 moderate, 13 high, 2 critical)
- auto-package updater - bump packages and versions, as current ones are out of date
- npx
  - booting with npx will be slow and re-download packages (issue also when building/cicd, and in dev env)
  - means that dev/cicd may pass with one version, and then in prod use a different version
- Use tsc/compiler for production (minor, but will take hit at start and maybe runtime to cache)
- File IDD10307.amoc.xml should be moved to testing resources directory I suspect
## Code Issues
- Several locations of instantiating objects on every request/in class methods rather than once and reusing
- GET on API endpoints may be cached - may or may not be an issue
- ... spread operator - likely an issue at scale wrt memory and cpu?
- 'magic numbers'/strings
- naming of files
- naming of classes/objects/vars
  - 'Downloader' that is specific/coupled to particular downloads
  - 'ERRORMESSAGE' no underscore
- logger/console.log usage
  - probably shouldn't overwrite console.log/console.error
  - file queuing/async writing - write() is slow
  - current async file log writing may be unusable with concurrent processes/threads
  - no try/catch when logging - may error with JSON.stringify - particularly if circular. Is also slow
  - what happens in event of crash/exit? I believe stream may not be written to disk
  - seems pointless with regular linux commands to pipe output
  - No timing data
  - Not using write stream .write() correctly - should not write(). Is allowed, but can cause mem issues, and remote exploitation
  - Args may not be JSON.stringify-able, or may not be intended for it as normal system uses it too
    - eg. console.error('my error', 2, null) would attempt to JSON.stringify('my error', 2, null)
- mixing require/import
- not using TS concepts like enum
- not using promises (eg. fs instead of fs.promises)
- unhelpful error message (ERRORMESSAGE="Something went wrong")
- 'getWarnings' should not return map of string -> true, but an array of strings (or set)
- Downloader.download is doing the same thing that getWarnings is doing - duplicate code.
- Not checking results - eg. FTPResponse of downloading a file
- Download.download and Download.downloadText are near equivalent but for extension - pass as arg
  - No reason to keep 'key' instead of just filename, but if class made more specific, extract common code and make them wrapper functions
- Download.download will keep type of file - could be binary, or ANSI etc - but assumed to be utf8
- Mixed case for Amoc/StateId resolving - be consistent
  - Also convert input string to expected case first
## 1000x Load Scaling
- what is current load?
- using node with 1 thread/process/core - fork() is one way to use all cores
- npx boot time is slow
- load tests - like k9/k8?
- how is this project deployed? In a container? On EC2? Can it scale?
- ExpressJS handles X req/s
  - Basic seems to be 5000/s with 6 cores used for Hello World app
- No DB? So can we cache everything?
- Could be very high if traffic is quite volatile/uneven
- memory/cpu used by requests? time to respond to requests? (95 max requirement, and existing perf
- Number of connections to DB, to external FTP server/API limits, cache staleness threshold, costs
- file logging will be very hard to manage/debug - no central way to debug it, analyse which machine wrote it
- Parsing XML (and on every request) would be slow
## Uncategorised
- using ftp
  - slow to go through all connections/commands
  - no sftp

# Suggestions
- Employ cache
  - Can be done many ways - eg. API Gateway cache, or reddis cache for more control - try to avoid hitting servers before accessing cache
  - Could even use S3
- Schedule downloading/parsing all files for quick responses. Consider storing entire responses in cache or DB
  - Try not to do this on each individual machine - scaling will make this messy. Share results from a single scheduled instance/lambda to cache/db/EFS
- What if files are large XML?
  - ETL perhaps - potentially alter to host XML on S3 - then return S3 signed URL through API
- Replace logger with industry standard/lib specialised
 - console logging may be synchronous, not handle encodings, lack timing data, may not handle multiple threads or processes etc
- Make / endpoint /state/:state
- Fix vulnerabilities in npm packages (at least if in prod packages)

# Load Test
- Small modifications for getWarnings (still searches for state each req)
 - Handles 100 vus
   - ~26ms resp
 - Fails 10k vus
 - Mixed results at 1k vus
   - 93% status 200 (same for correct content) - 6.69% err
   - p95 still low - 26ms
 - Similar @500vus
   - 2.39% err
   - p95 = 5ms
 - 99% @300vus (0.27% err)
- Using map for state warning lookups - no searching of lists
  - @1000vus - 93% still (6.75% err), and similar resp duration
  - p95 for 100vus - 0.5ms
  - @300vus - 0.06% err, 3.7ms resp
- w/ulimit -n 1024 (up from 256)
  - @1000vus - 89% - 11% err, p95=80ms
- w/ulimit -n 2048 (4096 is too many)
  - @1000vus - similar results as 1024
  - (closing ff) @1000vus and 10k iterations - only 0.9% err
## Breakpoint /?state=Qld
- includes changes to ftp and map lookup for warnings
- ulimit=2048, max 10k vus, p95<1s and cache-express package
  - breakpoint at 6176 iterations/s (p95>1s triggered), p95=1.17, max=1.72s, no errors
- remove cache-express package
  - breakpoint at 6440 iterations/s (p95>1s triggered), p95=1.09, max=1.74s, no errors
- revert state search
  - breakpoint at 6441 iterations/s (p95>1s triggered), p95=1.16, max=1.79s, no errors
- ~no changes for root endpoint
  - near immediate failures - 1100it/s, 48% errors, timing out in ftp connections server-side
  - made easy-mode. fails at 350/s, content failures 99%, p95=7.07s, max=15.5s (~1400vus)
## Breakpoint /warning/IDQ10090
- ~no changes for warning endpoint
  - easy mode. fails at 168it/s, p95=2.2s, max=2.9s, (~370vus)
- With cache, subsequent hits fail at about the same 6k it/s
- To make 1000x performant: 28 servers to get 168*1000 it/s (dependent on file being DL first)


# Present
## Note down any issues you see
## Top 5 Things
> Determine the 5 most critical parts of the project that need changing
> based on the scenario above. For each one, consider the changes that 
> you would make to improve the codebase.
- Redundant FTP processing
  - What
    - Re-connecting to FTP server for every request (both endpoints, index.ts)
    - Re-downloading existing files (Download.ts/Amoc.ts)
    - Extra XML parsing (floodWarning.ts)
  - Why
    - V.Slow, bottleneck, redundant, rate limiting, XML Parsing expensive
  - How
    - Singleton with setup at start - store list of files (need cache invalidation though)
    - Pre-download files, check for existence before downloading next
- No cache in front of requests and ftp files
  - Why
    - 150/s for warning download, 350/s for state warnings (w/o changes)
    - ~6000/s with state warnings pre-downloaded and stored in map<state, array>
    - ~6000/s for Downloader (after 1st download) with expressCache()
  - How
    - 'cache' in memory - use map as lookup for state warnings (singleton initialised at startup)
    - Add cache to requests (specifically DL requests) - expressCache
    - Add cache for all requests at edge/cloudfront/api gateway etc
      - Add compression too
    - Add cache/DB for multiple servers to utilise - eg. DynamoDB/+DAX or perhaps elasticache for small data
      - If large (400kb+ for ddb, cache RAM cost for elasticache), could use S3 links instead of direct content results
      - If cannot alter frontend/api contract, connected EFS volumes or S3 download (w/multipart DL, same region, and Transfer Acceleration on bucket+Client endpoints)
- Add CICD
  - Vuln. scanning (Fix 2 Crit. Vulns)
  - Automated incremental upgrades
  - Test coverage + Code Smells (eg. unused code, duplicate code, using deprecated fns)
  - Containerise for deployment (eg. Fargate, Lambda, or ECS/EKS)
- Production not running `npm install`, no node version, using ts-node instead of compiling, (npm dev using npx in nodemon), (and logging in prod wouldn't work well)
  - Why
    - Packages arent installed for prod
    - Slower, especially at boot or new request/file - could be significant if starting many servers
    - `npx ts-node` will always any `ts-node` available in path, not prod version or package version.
    - prod/dev using mismatched node version causing issues
  - How
    - 'engines' package.json
    - npm install --production (in CICD) and other build scripts
- Use secure protocols
  - What
    - FTPS (or pref. a more efficient API) for BOM files, and upgrading and fixing critical vulns
    - HTTPS to ELB
  - Why
    - FTP is slow and somewhat unreliable
    - Insecure connection means subject to MITM and files/servers being faked, potentially even attacked through FTP connection
  - How
    - If unable to use FTPS, perhaps use firewalls/security groups to ensure correct IP
    - If available, use REST API etc. May even help with caching content (eg. pre-check with server if content has changed)
- Smaller Code Issues?
  - REST endpoint for state warnings
  - Memory leak with not closing FTP connections
  - NestJS + standardisation efforts
  - Replace Logger (particularly to handle microservice/large scale deployments/concurrency)
  - Enums (and fixing switch statements) and mixed-case state values
  - Logger multiple .write() without draining
## What changes would be made (if any) for 1000x load + new features + critical
>Consider the application's architecture and production run time and 
> think about what changes would you make (if any) to accommodate the 
> new requirements.
- Replace logger (pref. with class)
  - Setup + Use CloudWatch Logs for aggregation
  - Eg. aws-cloudwatch-log package
  - Timing, request IDs, server IDs, etc
- Use cluster or pm2 if on multiple-core CPU (and check memory-limits, open file descriptor limits)
- Utilise caching where possible
  - pref. on edge w/something like API Gateway or CloudFront to limit compute reqs
- Consider Deployment
  - Build scripts, CICD, tests
  - Potential containerisation w/EKS, or EC2, or Lambda, with EFS/DDB/memcached
- For files: Pre-Download; DB-store; or S3-link. Potentially handle downloading w/single instance through SQS or Scheduling (if Push not available)
  - Could be checked on any instance (but might be less performant or redundant/simultaneous checks)
  - Job to download (and process/store in DB/S3) could be added to queue (event driven). In which case, GET could long-wait, or poll from frontend
- Front HTTPS (may already be the case) - Use ELB or API Gateway and AWS Certificate Manager + Route53