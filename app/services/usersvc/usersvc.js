import JWTUtils from "../../utils/jwtutils.js";
import { v4 as uuidv4 } from "uuid";
import {
  ErrInternal,
  ErrDBQuery,
  ErrInvalidArg,
} from "./usersvc_err.js";

export class UserSvc {
  constructor(pgI, logger) {
    this.pgI = pgI;
    this.logger = logger;
  }

  async SignUp(signupreq) {
    return this.#signupemailpwdv1(signupreq);
  }

  async #signupemailpwdv1(signupreq) {
    try {
      if (!this.#isvalidemailpwdSigunupReq(signupreq)) {
        return [null, ErrInvalidArg];
      }

      const userid = uuidv4();
      const email = signupreq.email;
      const mobile = signupreq.mobile;
      const password = signupreq.password;
      const name = signupreq.name;

      const mobileCheckQuery = `SELECT mobile FROM users where mobile = $1`;
      const mobileCheckqueryparams = [userid, mobile];

      // Execute query
      const emailCheckresult = await this.pgI.Query(
        mobileCheckQuery,
        mobileCheckqueryparams
      );
      if (emailCheckresult.rowCount > 0) {
        return [null, ErrInternal];
      }

      let addusermeta = {
        userid: userid,
        mobile: mobile,
        email: email,
        name: name,
        password: password,
        ispendingapproval: false,
        usermeta: {},
        isenabled: true,
      };

      let txnResp = await this.#inserttouserpwdentries(addusermeta);
      if (txnResp[1] !== null) {
        return txnResp;
      }
      return txnResp;
    } catch (error) {
      this.logger.error("Error email password signup");
      this.logger.error(error);
      return [null, ErrInternal];
    }
  }

  async #inserttouserpwdentries(addusermeta) {
    try {
      let txresp = await this.pgI.RunTransaction(async (client) => {
        let uresp = await this.#addToUsersTable(client, addusermeta);
        if (uresp[1] != null) {
          return [null, uresp[1]];
        }
        return [uresp[0], null];
      });
      return txresp;
    } catch (error) {
      this.logger.error("Error inserting entries: inserttouserpwdentries");
      this.logger.error(error);
      return [null, ErrDBQuery];
    }
  }

  async #addToUsersTable(client, addusermeta) {
    try {
      const query = `INSERT into users (userid, mobile, email, name, password, ispendingapproval, isenabled, updatedat, usermeta, updatedby) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning userid, mobile, email, name, ispendingapproval, isenabled, updatedat, usermeta, updatedby`;
      const queryparams = [
        addusermeta.userid,
        addusermeta.mobile,
        addusermeta.email,
        addusermeta.name,
        addusermeta.password,
        addusermeta.ispendingapproval,
        true,
        new Date().getTime(),
        addusermeta.usermeta,
        addusermeta.userid,
      ];

      // Execute a query
      const result = await client.query(query, queryparams);
      if (result.rowCount == 0) {
        throw new Error("Could not insert into users table " + userid);
      }

      let row = result.rows[0];
      let userinfo = {
        userid: row.userid,
        email: row.email,
        mobile: row.mobile,
        name: row.name,
        ispendingapproval: row.ispendingapproval,
        isenabled: row.isenabled,
        updatedat: parseInt(row.updatedat),
        usermeta: row.usermeta,
      };
      return [userinfo, null];
    } catch (error) {
      this.logger.error(error);
      return [null, ErrDBQuery];
    }
  }

  #isvalidemailpwdSigunupReq(signupreq) {
    if (this.#isNil(signupreq.name) || signupreq.name == "") {
      return false;
    }

    if (
      this.#isNil(signupreq) ||
      this.#isNil(signupreq.password)
    ) {
      return false;
    }

    // const validEmail = (email) => {
    //   return email.match(
    //     /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    //   );
    // };

    const validPassword = (pw) => {
      return (
        /[A-Z]/.test(pw) &&
        /[a-z]/.test(pw) &&
        /[0-9]/.test(pw) &&
        /[^A-Za-z0-9\\\/ ]/.test(pw) &&
        pw.length > 7
      );
    };

    // if (!validEmail(signupreq.email)) {
    //   return false;
    // }
    if (!validPassword(signupreq.password)) {
      return false;
    }
    return true;
  }

  #isNil(input) {
    if (input === undefined || input === null) return true;
    return false;
  }
}
