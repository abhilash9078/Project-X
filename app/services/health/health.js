export default class HealthSvc {
  constructor() {}

  GetHealthStatus() {
    return {
      status: "OK",
      timestamp: new Date().getTime(),
    };
  }
}
