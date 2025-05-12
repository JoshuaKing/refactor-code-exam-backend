import express from "express";
import expressCache from "cache-express";
import {Amoc} from "./floods/amoc";
import { Downloader } from "./floods/Downloader";
import { getAmocToStateId } from "./floods/getAmocToStateId";
import { FloodWarningParser } from "./parser/floodWarning";
import "./logger";

const app = express();
const port = 3000;

const ERROR_MESSAGE = "Something went wrong";

app.get("/state/:state", async (req, res, next) => {
  try {
    const data = await Amoc.get().getWarnings();

    const state = getAmocToStateId(req.params.state);
    if (!data.has(state)) {
      throw new Error(`Invalid State Value: ${state}`)
    }

    let results = data.get(state) ?? [];
    res.send(results);
  } catch (error) {
    next(error)
  }
});

app.get("/warning/:id", expressCache(), async (req, res, next) => {
  try {
    const downloader = new Downloader();
    const xmlid = req.params.id;

    const warning = await downloader.download(xmlid);
    const warningParser = new FloodWarningParser(warning);
    const text = await downloader.downloadText(xmlid);

    let warningJson = await warningParser.getWarning();
    warningJson['text'] = text || "";
    res.send(warningJson); // spread op, and text || '' shouldnt have any affect (would replace return value of '' with supplied '' though)
  } catch (error) {
    next(error)
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).send({ error: ERROR_MESSAGE });
});

async function setup() {
  await Amoc.get().setup();
  app.listen(port, 'localhost', 4096, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}


setup();