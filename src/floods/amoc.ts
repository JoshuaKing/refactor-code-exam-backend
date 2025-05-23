import { Client } from "basic-ftp";

export class Amoc {
  private static _instance: Amoc;
  private static _config = {
    ftp: {
      path: '/anon/gen/fwo/',
      host: 'ftp.bom.gov.au',
      secure: false,
      verbose: true,
    }
  };
  private isSetup = false;
  private warnings: Map<string, string[]> = new Map();

  static get(): Amoc {
    return Amoc._instance ?? (Amoc._instance = new Amoc(new Client(), Amoc._config));
  }
  private constructor(private client: Client = new Client(), private config: typeof Amoc._config) {
    client.ftp.verbose = config.ftp.verbose;
  };

  async setup() {
    if (this.isSetup) {
      return;
    }
    try {
      await this.client.access({
        host: this.config.ftp.host,
        secure: this.config.ftp.secure,
      });

      const files = await this.client.list(this.config.ftp.path);

      for (const file of files) {
        const match = file.name.match(/(.{3})(.*)\.amoc\.xml$/)
        if (match?.length) {
          const stateIdPrefix = match[1];
          const fileIdSuffix = match[2];
          const stateWarnings = this.warnings.get(stateIdPrefix) ?? [];
          stateWarnings.push((stateIdPrefix + fileIdSuffix))
          this.warnings.set(stateIdPrefix, stateWarnings);
        }
      }
      this.isSetup = true;
      console.log("Amoc FTP client setup");
    } catch (err) {
      console.error(err);
    }
  }

  // Unneeded as singleton
  async [Symbol.asyncDispose]() {
    console.log("Disposing FTP client");
    await this.client.close();
  }

  public async getWarnings(): Promise<typeof this.warnings> {
      await this.setup();
      return this.warnings;
  }
}
