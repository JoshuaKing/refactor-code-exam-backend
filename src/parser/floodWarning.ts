import { Downloader } from "../floods/Downloader";
import { parser } from "./parser";
import {ProductType} from "./product-type.enum";
import {Service} from "./service.enum";

export class FloodWarningParser {
  constructor(private xmlString: string) {}

  async getWarning() {
    const obj: any = await parser.parseStringPromise(this.xmlString);

    const xmlProductType = (obj.amoc["product-type"] || [])[0] as keyof typeof ProductType; // if amoc undefined/product-type is not array/indexable - then error
    const productType = ProductType[xmlProductType];

    const xmlService = (obj.amoc["service"] || [])[0] as keyof typeof Service;
    const service = Service[xmlService];

    return {
      productType,
      service,
      start: await this.getIssueTime(), // redundant xml parsing, also why not separate other code likewise
      expiry: await this.getEndTime(), // bad idea to rename specific things like 'expiry' time to general 'end' time. Also not using UTC like getIssueTime
    };
  }
  async getIssueTime() {
    const obj: any = await parser.parseStringPromise(this.xmlString);

    let issuetime = (obj.amoc["issue-time-utc"] || [])[0];

    return issuetime;
  }

  async getEndTime() {
    const obj: any = await parser.parseStringPromise(this.xmlString);

    let issuetime = (obj.amoc["expiry-time"] || [])[0];

    return issuetime;
  }

  async getWarningText(): Promise<string> { // Unused
    const obj: any = await parser.parseStringPromise(this.xmlString);
    const downloader = new Downloader();

    const warningText = await downloader.downloadText(obj.amoc.identifier[0]);

    return warningText;
  }
}
