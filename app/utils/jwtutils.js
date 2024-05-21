import { SignJWT, jwtVerify, decodeJwt } from "jose";
import { hexToKey } from "./eccutils.js";

export default class JWTUtils {
  constructor() {
    this.issuer = "";
    this.audience = "";
    this.expiresIn = "1d"; // Token expiration time
  }

  async GenerateJWT(payload, privateKeyHex, expiresIn = this.expiresIn) {
    const privateKey = hexToKey(privateKeyHex, "private");

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: "EdDSA" })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime(expiresIn)
      .sign(privateKey);

    return jwt;
  }

  async ValidateJWT(token, publicKeyHex) {
    const publicKey = hexToKey(publicKeyHex, "public");

    try {
      const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ["EdDSA"],
      });

      // console.log("Token is valid. Decoded payload:", payload);
      return payload;
    } catch (error) {
      console.error("ValidateJWT: Token validation failed:", error.message);
      return null;
    }
  }

  async DecodeJWT(token) {
    try {
      const claims = decodeJwt(token);
      // console.log("Decoded payload:", claims);
      return claims;
    } catch (error) {
      console.error("DecodeJWT: Decoding payload failed:", error.message);
      return null;
    }
  }
}
