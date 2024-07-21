import XErr from "../../utils/xerr.js";

export const ErrDBQuery = new XErr(
  "ERR_DB_QUERY",
  null,
  "err while running db query"
);

export const ErrInvlaidIdToken = new XErr(
  "INVALID_IDTOKEN",
  null,
  "invalid idtoken"
);

export const ErrUserPendingApproval = new XErr(
  "PENDING_APPROVAL",
  null,
  "Your account in not yet approved!!! Please contact the Administrator"
);

export const ErrInternal = new XErr("ERR_INTERNAL", null, "internal error");

export const ErrUserNotFound = new XErr(
  "ERR_USER_NOT_FOUND",
  null,
  "user not found"
);

export const ErrUnAuthorized = new XErr(
  "ERR_UNAUTHORIZED",
  null,
  "unauthorized"
);

export const ErrUserIsDisabled = new XErr(
  "ERR_USER_IS_DISABLED",
  null,
  "user is disabled"
);

export const ErrUserIsAlreadyApproved = new XErr(
  "ERR_USER_IS_ALREADY_APPROVED",
  null,
  "user is already approved"
);

export const ErrEmailAlreadySignedup = new XErr(
  "ERR_EMAIL_ALREADY_SIGNED_UP",
  null,
  "email already signed up"
);

export const ErrEmailVerificationStep = new XErr(
  "ERR_EMAIL_VERIFICATION_STEP",
  null,
  "email verification step failed"
);

export const ErrInvalidPassword = new XErr(
  "ERR_INVALID_PASSWORD",
  null,
  "invalid user or password"
);

export const ErrEmailUnverified = new XErr(
  "ERR_EMAIL_UNVERIFIED",
  null,
  "email unverified"
);

export const ErrEmailAlreadyVerified = new XErr(
  "ERR_EMAIL_ALREADY_VERIFIED",
  null,
  "email already verified"
);

export const ErrTryAfterSomeTime = new XErr(
  "ERR_TRY_LATER",
  null,
  "try after some time"
);

export const ErrInvalidToken = new XErr("INVALID_TOKEN", null, "invalid token");

export const ErrInvalidArg = new XErr(
  "INVALID_ARG",
  null,
  "invalid argmuent given"
);
