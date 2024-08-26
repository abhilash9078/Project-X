import { ErrUnAuthorized } from "../../services/usersvc/usersvc_err.js";
import {
  APIResponseSvc,
  APIResponseUnauthorized,
} from "../../utils/handlers.js";
import XErr from "../../utils/xerr.js";

export const ErrReqInvalid = new XErr(
  "ERR_INVALID_REQ",
  null,
  "invalid request"
);

export const ErrLoginReqInvalid = new XErr(
  "ERR_LOGIN_REQ_MALFORMED",
  null,
  "login req looks malformed"
);

export class UserHdlr {
  constructor(userSvcI) {
    this.userSvcI = userSvcI;
  }

  SignUp = async (req, res) => {
    const signupreq = req.body;

    const resp = await this.userSvcI.SignUp(signupreq);
    return APIResponseSvc(req, res, resp, "Sign up Completed");
  };

  Login = async (req, res) => {
    const loginreq = req.body;

    const resp = await this.userSvcI.Login(loginreq);
    return APIResponseSvc(req, res, resp, "Login Token Fetched successfully");
  };

  AddAddress = async (req, res) => {
    const addaddressreq = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    if (!token) return APIResponseUnauthorized(req, res, ErrUnAuthorized);

    const resp = await this.userSvcI.AddAddress(addaddressreq, token);
    return APIResponseSvc(req, res, resp, "Address added successfully");
  };

  RegisterRoutes(router) {
    router.post("/signup", this.SignUp);
    router.post("/login", this.Login);
    router.post("/addaddress", this.AddAddress);
  }
}
