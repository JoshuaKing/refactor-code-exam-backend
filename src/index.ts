import express from "express";
import {Amoc} from "./floods/amoc";
import { Downloader } from "./floods/Downloader";
import { getAmocToStateId } from "./floods/getAmocToStateId";
import { FloodWarningParser } from "./parser/floodWarning";
import "./logger";

const app = express();
const port = 3000;

const ERRORMESSAGE = "Something went wrong";

app.get("/", async (req, res) => {
  try {
    const data = await Amoc.get().getWarnings();

    const state = getAmocToStateId(req.query.state?.toString() || "");

    let results = [];
    for (const key of data) {
      if (key.startsWith(state)) {
        results.push(key.replace(/\.amoc\.xml/, ""));
      }
    }

    res.send(results);
  } catch (error) {
    console.log(error);
    res.send(ERRORMESSAGE);
  }
});

app.get("/warning/:id", async (req, res) => {
  try {
    const downloader = new Downloader();
    const xmlid = req.params.id;

    const warning = await downloader.download(xmlid);
    const warningParser = new FloodWarningParser(warning);
    const text = await downloader.downloadText(xmlid);

    res.send({ ...(await warningParser.getWarning()), text: text || "" }); // spread op, and text || '' shouldnt have any affect (would replace return value of '' with supplied '' though)
  } catch (error) {
    console.log(error);
    res.send(ERRORMESSAGE); // would be 200 OK instead of HTTP error status code
  }
});

async function setup() {
  await Amoc.get().setup();
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}


setup();