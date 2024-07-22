import * as crypto from "crypto";

export async function sleep(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}


export function GetTokenFromHeader(headers) {
  let authheader = headers.authorization;

  if (authheader === undefined || authheader === null) {
    return null;
  }

  if (authheader.indexOf("Bearer ") != -1) {
    authheader = authheader.substring(
      authheader.indexOf("Bearer ") + 7,
      authheader.length
    );
  }

  return authheader;
}

export function GetRefererFromHeader(headers) {
  let refererheader = headers.referer;

  if (refererheader === undefined || refererheader === null) {
    return "";
  }

  return refererheader;
}

export function GetBaseUIPathFromReferer(headers) {
  let refererheader = headers.referer;

  if (refererheader === undefined || refererheader === null) {
    return "";
  }

  let sa = refererheader.split("/");
  let baselink = sa.slice(0, Math.min(3, sa.length)).join("/");
  return baselink;
}

// Method to set salt and hash the password for a user
export function GetPasswordHash(reqpassword, userid) {
  const salt = userid;
  // Hashing user's salt and password with 1000 iterations,
  let passwordhash = crypto
    .pbkdf2Sync(reqpassword, salt, 1000, 64, `sha512`)
    .toString(`hex`);
  return passwordhash;
}

export function IsvalidPassword(reqpassword, userid, hashedpassword) {
  return GetPasswordHash(reqpassword, userid) === hashedpassword;
}
