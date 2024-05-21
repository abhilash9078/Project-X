import pg from "pg";
import XErr from "./xerr.js";

export const ErrConnect = new XErr("ERR_CONNECT", null, "db connect error");
export const ErrTXNRollback = new XErr(
  "ERR_TXN_ROLLBACK",
  null,
  "txn rollback error"
);
export const ErrTXNExec = new XErr("ERR_TXN_EXEC", null, "txn exec error");

export class PgPool {
  constructor(pgcfg, logger) {
    this.logger = logger;
    this.Pool = new pg.Pool({
      user: pgcfg.user,
      host: pgcfg.host,
      port: pgcfg.port,
      database: pgcfg.database,
      password: pgcfg.password,
      min: 2,
      max: 5,
      statement_timeout: 30 * 1000,
    });
    this.Pool.on("connect", (client) => {
      client.query("SET search_path TO " + pgcfg.schema + ",public");
    });
  }

  async Query(...args) {
    return this.Pool.query(...args);
  }

  async RunTransaction(queryfn) {
    let client = null;
    try {
      client = await this.Pool.connect();
    } catch (error) {
      this.logger.error(error);
      return [null, ErrConnect];
    }
    try {
      await client.query("BEGIN");
      let funcres = await queryfn(client);
      await this.TxRollback(client);
      return funcres;
    } catch (error) {
      //   console.log("Tx Exec err:", e.toString());
      //   console.log(e);
      let rollbackerr = await this.TxRollback(client);
      if (rollbackerr != null) {
        this.logger.error(rollbackerr);
        return [null, ErrTXNRollback];
      }
      this.logger.error(error);
      return [null, ErrTXNExec];
    } finally {
      client.release();
    }
  }

  async TxCommit(client) {
    try {
      await client.query("COMMIT");
    } catch (error) {
      return error;
    }
    return null;
  }

  async TxRollback(client) {
    try {
      await client.query("ROLLBACK");
    } catch (error) {
      return error;
    }
    return null;
  }

  async End() {
    try {
      await this.Pool.end();
    } catch (error) {
      return error;
    }
    return null;
  }
}
