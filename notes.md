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