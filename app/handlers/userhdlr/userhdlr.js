import XErr from "../../utils/xerr.js";
import {
  APIResponseSvc,
  ApiResponseXErr,
} from "../../utils/handlers.js";

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

  SignUp = async (req, res, next) => {
    let singupreq = req.body;

    let resp = await this.userSvcI.SignUp(singupreq);
    return APIResponseSvc(req, res, resp, "Sign up Completed");
  };

  RegisterRoutes(router) {
    router.post("/signup", this.SignUp);
  }
}
