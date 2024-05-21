import {
  APIResponseInternalErr,
  APIResponseOK,
} from "../../utils/handlers.js";

export class HealthHdlr {
  constructor(healthSvcI) {
    this.healthSvcI = healthSvcI;
  }

  GetHealthStatus = async (req, res, next) => {
    try {
      let healthStatus = this.healthSvcI.GetHealthStatus();
      APIResponseOK(req, res, healthStatus, "Health Status retrieved");
    } catch (error) {
      APIResponseInternalErr(
        req,
        res,
        "HEALTH_STATUS_ERR",
        error.toString(),
        "health status query failed"
      );
    }
  };

  RegisterRoutes(router) {
    router.get("/check", this.GetHealthStatus);
  }
}
