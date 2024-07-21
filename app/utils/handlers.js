// API Response structure...
export function apiresponseerror(errcode, errdata) {
  return {
    errcode: errcode,
    errdata: errdata,
  };
}

export function apiresponse(err, data, msg) {
  return {
    err: err,
    data: data,
    msg: msg,
  };
}

export function APIResponseSvc(req, res, resp, succmsg) {
  if (resp[1] != null) {
    return ApiResponseXErr(req, res, resp[1]);
  } else {
    return APIResponseOK(req, res, resp[0], succmsg);
  }
}

export function APIResponseOK(req, res, data, msg) {
  res.status(200).send(apiresponse(null, data, msg));
}

export function ApiResponseXErr(req, res, xerrI) {
  return APIResponseInternalErr(
    req,
    res,
    xerrI.errcode,
    xerrI.errdata,
    xerrI.errmsg
  );
}

export function APIResponseError(req, res, statuscode, errcode, errdata, msg) {
  return res
    .status(statuscode)
    .send(apiresponse(apiresponseerror(errcode, errdata), null, msg));
}

export function APIResponseBadRequest(req, res, errcode, errdata, msg) {
  return APIResponseError(req, res, 400, errcode, errdata, msg);
}

export function APIResponseUnauthorized(req, res, errcode, errdata, msg) {
  return APIResponseError(req, res, 401, errcode, errdata, msg);
}

export function APIResponseForbidden(req, res, errcode, errdata, msg) {
  return APIResponseError(req, res, 403, errcode, errdata, msg);
}

export function APIResponseInternalErr(req, res, errcode, errdata, msg) {
  if (errdata === null) {
    return APIResponseError(req, res, 500, errcode, errdata, msg);
  } else {
    return APIResponseError(req, res, 400, errcode, errdata, msg);
  }
}
