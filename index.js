import fs from "fs";
import winston from "winston";
import path from "path";
import DailyRotateFile from "winston-daily-rotate-file";
import { PgPool } from "./app/utils/pgpool.js";
import APIServer from "./app/utils/apiserver.js";
import HealthSvc from "./app/services/health/health.js";
import { HealthHdlr } from "./app/handlers/health/health.js";

if (process.argv.length < 3) {
  console.log("Run as node index.js <file:config.json>");
  process.exit(1);
}

// The config has been given here, we can proceed with the starting of the services...
const logtimestamp = winston.timestamp;
const myFormat = winston.format.printf(
  ({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${JSON.stringify(message)}`;
  }
);

let loggercreatef = function (logdir, filename) {
  const logfilename = path.join(logdir, filename + "-%DATE%.log");
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.label({ label: filename }),
      winston.format.timestamp(),
      myFormat
    ),
    // transports: [new winston.transports.File({ filename: logfilename })],
    transports: [
      new DailyRotateFile({
        level: "info",
        filename: logfilename,
        zippedArchive: true,
        datePattern: "YYYY-MM-DD",
        maxSize: "10m",
        maxFiles: 10,
      }),
    ],
  });

  if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console());
  }

  return logger;
};

// 0. Config Related...
let configfile = process.argv[2];
let config = JSON.parse(fs.readFileSync(configfile, "utf8"));
let apiserverport = config.apiserver.port;
let logdir = path.join(config.scratchdir, "logs");
fs.existsSync(logdir) || fs.mkdirSync(logdir);

const pgDBCfgI = config.pgdb;
let pgPoolI = new PgPool(pgDBCfgI, loggercreatef(logdir, "pglogs"));

// Services...
let healthSvcI = new HealthSvc();

// Handlers...
let healthHdlrI = new HealthHdlr(healthSvcI);

// Routes...
let apiRoutes = [["/api/v1/health/", healthHdlrI]];

// API Server...
let apiserverlogger = loggercreatef(logdir, "apiserver");
let App = new APIServer(apiRoutes, apiserverlogger);

App.Start(apiserverport);
