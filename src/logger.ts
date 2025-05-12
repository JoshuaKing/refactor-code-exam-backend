import fs from "fs";

if (process.env.NODE_ENV == "production") {
  const stdOut = process.stdout.write;
  const stdErr = process.stderr.write;

  const logFile = fs.createWriteStream("logs.log", { flags: "a" });

  process.stdout.write = function<T extends Parameters<typeof process.stdout.write>>(args: T) {
    if (logFile.writable) {
      logFile.write.apply(logFile, ['STDOUT: ' + JSON.stringify(args) + '\n', 'utf8']);
    } else {
      stdErr.apply(process.stderr, ['LogFile Not Writable']);
      process.exit(-1);
    }
    return stdOut.apply(process.stdout, Array.isArray(args) ? args : [args]);
  };

  process.stderr.write = function<T extends Parameters<typeof process.stderr.write>>(args: T) {
    if (logFile.writable) {
      logFile.write.apply(logFile, ['STDERR: ' + JSON.stringify(args) + '\n', 'utf8']);
    } else {
      stdErr.apply(process.stderr, ['LogFile Not Writable']);
      process.exit(-1);
    }
    return stdErr.apply(process.stderr, Array.isArray(args) ? args : [args]);
  };
}
