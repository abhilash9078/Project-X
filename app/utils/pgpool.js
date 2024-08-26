import pg from "pg";
import XErr from "./xerr.js";

const ErrConnect = new XErr("ERR_CONNECT", "Database connection error");
const ErrTXNRollback = new XErr(
  "ERR_TXN_ROLLBACK",
  "Transaction rollback error"
);
const ErrTXNExec = new XErr("ERR_TXN_EXEC", "Transaction execution error");

export class PgPool {
  constructor(pgcfg, logger) {
    this.logger = logger;
    this.pool = new pg.Pool({
      user: pgcfg.user,
      host: pgcfg.host,
      port: pgcfg.port,
      database: pgcfg.database,
      password: pgcfg.password,
      min: 2,
      max: 5,
      statement_timeout: 30 * 1000,
      ssl: {
        rejectUnauthorized: false, // For self-signed certificates
      },
      sslmode: "require", // Ensure SSL is required
    });

    this.pool.on("connect", (client) => {
      client.query(`SET search_path TO ${pgcfg.schema},public`);
    });
  }

  async Query(text, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } catch (error) {
      this.logger.error(error);
      throw new XErr("ERR_QUERY", "Error executing query");
    } finally {
      client.release();
    }
  }

  async RunTransaction(queryfn) {
    let client = null;
    try {
      client = await this.pool.connect();
      await client.query("BEGIN");
      const result = await queryfn(client);
      await this.TxCommit(client);
      return result;
    } catch (error) {
      await this.TxRollback(client);
      this.logger.error(error);
      if (error instanceof XErr) {
        throw error;
      } else {
        throw new XErr("ERR_TXN_EXEC", "Error executing transaction");
      }
    } finally {
      if (client) client.release();
    }
  }

  async TxCommit(client) {
    try {
      await client.query("COMMIT");
    } catch (error) {
      throw new XErr("ERR_TXN_COMMIT", "Error committing transaction");
    }
  }

  async TxRollback(client) {
    try {
      if (client) await client.query("ROLLBACK");
    } catch (error) {
      throw new XErr("ERR_TXN_ROLLBACK", "Error rolling back transaction");
    }
  }

  async End() {
    try {
      await this.pool.end();
    } catch (error) {
      throw new XErr("ERR_POOL_END", "Error ending pool connection");
    }
  }
}
