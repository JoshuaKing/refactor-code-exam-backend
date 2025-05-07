import { Client } from "basic-ftp";

import fs from "fs";

export class Downloader {
  async download(key: string) {
    const client = new Client();
    client.ftp.verbose = true;
    try {
      await client.access({
        host: "ftp.bom.gov.au",
        secure: false,
      });

      await client.cd("/anon/gen/fwo/");

      const files = await client.list();

      for (var file in files) {
        if (files[file].name.endsWith(".amoc.xml")) { // redundant due to later checks
          if (`${key}.amoc.xml` == files[file].name) {
            await client.download(`./${key}.xml`, files[file].name); // Is .name correct? Arg should be path
          }
        }
      }
      client.close();

      const data = this.readData(key); // slow to read in entire file into memory in sync. Disagree on passing around key

      return data;
    } catch (err) {
      console.log(key + " file not found"); // not displaying err value anywhere
      return ""; // returning before .close(), also probably better to return undefined or throw or use other type
    }

    client.close(); // Unused
  }

  // public method
  readData(key: string): string { // only used once because it's so specific (.xml and key)
    return fs.readFileSync(`./${key}.xml`, { encoding: "utf-8" });
  }

  async downloadText(key: string) {
    const client = new Client();
    client.ftp.verbose = true;
    let warningText = "";
    try {
      await client.access({
        host: "ftp.bom.gov.au",
        secure: false,
      });

      await client.cd("/anon/gen/fwo/");

      await client.download(`./${key}.txt`, key + ".txt");

      warningText = fs.readFileSync(`./${key}.txt`, {
        encoding: "utf-8",
      });
    } catch (err) {
      console.log(key + " file not found");
      return ""; // close connection
    }

    client.close();

    return warningText;
  }
}
