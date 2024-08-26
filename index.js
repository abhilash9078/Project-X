import fs from "fs";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { HealthHdlr } from "./app/handlers/health/health.js";
import { UserHdlr } from "./app/handlers/userhdlr/userhdlr.js";
import HealthSvc from "./app/services/health/health.js";
import { UserSvc } from "./app/services/usersvc/usersvc.js";
import APIServer from "./app/utils/apiserver.js";
import { PgPool } from "./app/utils/pgpool.js";

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

const loggercreatef = function (logdir, filename) {
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
const configfile = process.argv[2];
const config = JSON.parse(fs.readFileSync(configfile, "utf8"));
const apiserverport = config.apiserver.port;
const logdir = path.join(config.scratchdir, "logs");
fs.existsSync(logdir) || fs.mkdirSync(logdir);

const pgDBCfgI = config.pgdb;
const pgPoolI = new PgPool(pgDBCfgI, loggercreatef(logdir, "pglogs"));

// Services...
const healthSvcI = new HealthSvc();
const servicelogger = loggercreatef(logdir, "service");
const userSvcI = new UserSvc(pgPoolI, servicelogger);

// Handlers...
const healthHdlrI = new HealthHdlr(healthSvcI);
const UserHdlrI = new UserHdlr(userSvcI);

// Routes...
const apiRoutes = [
  ["/api/v1/health/", healthHdlrI],
  ["/api/v1/user/", UserHdlrI],
];
// API Server...
const apiserverlogger = loggercreatef(logdir, "apiserver");
const App = new APIServer(apiRoutes, apiserverlogger);

App.Start(apiserverport);
