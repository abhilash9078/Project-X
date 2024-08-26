import { v4 as uuidv4 } from "uuid";
import { GenerateSecrets } from "../../utils/eccutils.js";
import JWTUtils from "../../utils/jwtutils.js";
import { GetPasswordHash, IsvalidPassword } from "../../utils/utils.js";
import {
  ErrDBQuery,
  ErrInternal,
  ErrInvalidArg,
  ErrInvalidPassword,
  ErrUnAuthorized,
  ErrUserNotFound,
  ErrUserPendingApproval,
} from "./usersvc_err.js";

export class UserSvc {
  constructor(pgI, logger) {
    this.pgI = pgI;
    this.logger = logger;
    this.jwtSvcI = new JWTUtils();
  }

  async SignUp(signupreq) {
    return this.#signupemailpwdv1(signupreq);
  }

  async Login(loginreq) {
    return this.#loginemailpwdv1(loginreq);
  }

  async AddAddress(addaddressreq) {
    return this.#addaddressv1(addaddressreq);
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
      const mobileCheckqueryparams = [mobile];

      // Execute query
      const emailCheckresult = await this.pgI.Query(
        mobileCheckQuery,
        mobileCheckqueryparams
      );
      if (emailCheckresult.rowCount > 0) {
        return [null, ErrInternal];
      }

      const addusermeta = {
        userid: userid,
        mobile: mobile,
        email: email,
        name: name,
        password: password,
        ispendingapproval: false,
        usermeta: {},
        isenabled: true,
      };

      const txnResp = await this.#inserttouserpwdentries(addusermeta);
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

  async #loginemailpwdv1(loginreq) {
    try {
      if (!this.#isvalidemailpwdLoginReq(loginreq)) {
        return [null, ErrInvalidArg];
      }
      const mobile = loginreq.mobile;
      const password = loginreq.password;

      const query = `SELECT userid, mobile, password, email, name, secretprv, secretpub, ispendingapproval, isenabled from users where mobile = $1`;
      const queryparams = [mobile];

      // Execute a query
      const result = await this.pgI.Query(query, queryparams);
      if (result.rowCount == 0) {
        return [null, ErrUserNotFound.NewData({ mobile })];
      }

      const row = result[0];
      const logininfo = {
        userid: row.userid,
        mobile: row.mobile,
        password: row.password,
        email: row.email,
        name: row.name,
        secretprv: row.secretprv,
        secretpub: row.secretpub,
        ispendingapproval: row.ispendingapproval,
        isenabled: row.isenabled,
      };

      // // email verification check
      // if (row.ispendingapproval === false) {
      //   return [null, ErrEmailUnverified.NewData({ mobile: mobile })];
      // }

      // approval check
      if (logininfo.ispendingapproval === true) {
        return [null, ErrUserPendingApproval.NewData({ mobile: mobile })];
      }

      if (IsvalidPassword(password, logininfo.userid, logininfo.password)) {
        return this.#respondWithLoginToken(logininfo);
      } else {
        return [
          null,
          ErrInvalidPassword.NewData({ mobile: mobile, password: password }),
        ];
      }
    } catch (error) {
      this.logger.error("Error email password signin");
      this.logger.error(error);
      return [null, ErrInternal];
    }
  }

  async #addaddressv1(addaddressreq, token) {
    try {
      if (!this.jwtSvcI.ValidateJWT(token)) {
        return [null, ErrUnAuthorized];
      }

      const userInfo = this.jwtSvcI.DecodeJWT(token);
      const userid = userInfo.userid;

      const addressid = uuidv4();
      const doorno = addaddressreq.doorNo;
      const street = addaddressreq.street;
      const area = addaddressreq.area;
      const landmark = addaddressreq.landmark;
      const city = addaddressreq.city;
      const state = addaddressreq.state;
      const mobile = addaddressreq.mobile;
      const pin = addaddressreq.pin;

      const addaddressmeta = {
        userid,
        addressid,
        mobile,
        pin,
        currentlocation: { doorno, street, area, city, state },
        landmark,
        addressmeta: {},
      };

      // Execute a query
      const txnResp = await this.#inserttouseraddressentries(addaddressmeta);
      if (txnResp[1] !== null) {
        return txnResp;
      }
      return txnResp;
    } catch (error) {
      this.logger.error("Error add user address");
      this.logger.error(error);
      return [null, ErrInternal];
    }
  }

  async #inserttouserpwdentries(addusermeta) {
    try {
      const txresp = await this.pgI.RunTransaction(async (client) => {
        const uresp = await this.#addToUsersTable(client, addusermeta);
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

  async #inserttouseraddressentries(addaddressmeta) {
    try {
      const txresp = await this.pgI.RunTransaction(async (client) => {
        const uresp = await this.#addUserAddressToTable(client, addaddressmeta);
        if (uresp[1] != null) {
          return [null, uresp[1]];
        }
        return [uresp[0], null];
      });
      return txresp;
    } catch (error) {
      this.logger.error("Error inserting entries: inserttouseraddressentries");
      this.logger.error(error);
      return [null, ErrDBQuery];
    }
  }

  async #addUserAddressToTable(client, addaddressmeta) {
    try {
      const query = `INSERT into useraddress (userid, addressid, mobile, pin, currentlocation, landmark, addressmeta, updatedby) values($1, $2, $3, $4, $5, $6, $7, $8) returning userid, addressid, updatedat, updatedby`;

      const queryparams = [
        addaddressmeta.userid,
        addaddressmeta.addressid,
        addaddressmeta.mobile,
        addaddressmeta.pin,
        addaddressmeta.curentlocation,
        addaddressmeta.landmark,
        addaddressmeta.addressmeta,
        addaddressmeta.userid,
      ];

      // Execute a query
      const result = await client.query(query, queryparams);
      if (result.rowCount === 0) {
        throw new Error("Could not insert into useraddress table " + userid);
      }

      const row = result.rows[0];
      const addressInfo = {
        userid: row.userid,
        addressid: row.addressid,
        updatedat: parseInt(row.updatedat),
        updatedby: row.updatedby,
      };
      return [addressInfo, null];
    } catch (error) {
      this.logger.error(error);
      return [null, ErrDBQuery];
    }
  }

  async #addToUsersTable(client, addusermeta) {
    try {
      const keypair = GenerateSecrets();
      const hashedpassword = GetPasswordHash(
        addusermeta.password,
        addusermeta.userid
      );

      const query = `INSERT into users (userid, mobile, email, name, password, secretprv, secretpub, ispendingapproval, isenabled, updatedat, usermeta, updatedby) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning userid, mobile, email, name, ispendingapproval, isenabled, updatedat, usermeta, updatedby`;
      const queryparams = [
        addusermeta.userid,
        addusermeta.mobile,
        addusermeta.email,
        addusermeta.name,
        hashedpassword,
        keypair.privateKey,
        keypair.publicKey,
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

      const row = result.rows[0];
      const userinfo = {
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

    if (this.#isNil(signupreq) || this.#isNil(signupreq.password)) {
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

  async #respondWithLoginToken(userinfo) {
    const currtime = new Date().getTime();
    const usertokenvalidity = currtime + 30 * 24 * 3600 * 1000;
    const accesstokenvalidity = currtime + 30 * 24 * 3600 * 1000;

    const secret = userinfo.secretprv;

    const usertokenpayload = {
      type: "user",
      mobile: userinfo.mobile,
      userid: userinfo.userid,
    };

    const usertoken = await this.jwtSvcI.GenerateJWT(
      usertokenpayload,
      secret,
      parseInt(usertokenvalidity / 1000.0)
    );

    const accesstokenpayload = {
      type: "access",
      mobile: userinfo.mobile,
      userid: userinfo.userid,
    };

    const accesstoken = await this.jwtSvcI.GenerateJWT(
      accesstokenpayload,
      secret,
      parseInt(accesstokenvalidity / 1000.0)
    );

    const loginuserinfo = {
      userid: userinfo.userid,
      email: userinfo.email,
      mobile: userinfo.mobile,
      name: userinfo.name,
    };

    return [{ usertoken, accesstoken, userinfo: loginuserinfo }, null];
  }

  #isNil(input) {
    if (input === undefined || input === null) return true;
    return false;
  }

  #isvalidemailpwdLoginReq(loginreq) {
    if (
      this.#isNil(loginreq) ||
      this.#isNil(loginreq.mobile) ||
      this.#isNil(loginreq.password)
    ) {
      return false;
    }
    return true;
  }
}
