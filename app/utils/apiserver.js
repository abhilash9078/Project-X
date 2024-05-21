import { APIResponseError, APIResponseForbidden } from "./handlers.js";
import promiserouter from "express-promise-router";
import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import morgan from "morgan";
import requestIp from "request-ip";
import cors from "cors";

export default class APIServer {
  constructor(apiroutehandlers, logger) {
    this.apiroutehandlers = apiroutehandlers;
    this.logger = logger;
  }

  Start(port) {
    let app = this.#getexpressapp();

    for (let eachhandler of this.apiroutehandlers) {
      let newrouter = promiserouter();
      eachhandler[1].RegisterRoutes(newrouter);
      app.use(eachhandler[0], newrouter);
    }

    app.use(this.#errornotfound);
    app.use(this.#errorhandler);

    app.listen(port, () => {
      this.logger.info("App listening on port:" + port);
    });
  }

  // # Private functions...
  #getexpressapp() {
    let app = express();
    app.use(compression());
    app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
    app.use(bodyParser.json({ type: "application/*+json", limit: "50mb" }));
    app.use(bodyParser.json());
    app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
    app.use(
      morgan(
        ":remote-addr :method :url :status :res[content-length] - :response-time ms",
        { stream: { write: (x) => this.logger.info(x) } }
      )
    );
    app.use(cors());
    app.use(requestIp.mw());
    return app;
  }

  #errornotfound(req, res, next) {
    // If we have reached here, we will throw an error..
    APIResponseForbidden(
      req,
      res,
      "FORBIDDEN_API",
      { path: req.path },
      "non-existing path"
    );
  }

  #errorhandler(err, req, res, next) {
    let errstr = JSON.stringify(err);

    if ("toString" in err) {
      errstr = err.toString();
    }

    APIResponseError(
      req,
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      errstr,
      "internal server error"
    );
  }
}
