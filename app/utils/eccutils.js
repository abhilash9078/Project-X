import crypto from "node:crypto";

export function CreateED25519KeyPair() {
  const keypair = crypto.generateKeyPairSync(
    "ed25519",
    crypto.ED25519KeyPairOptions
  );

  return keypair;
}

export function GenerateSecrets() {
  // Generate the ED25519 key pair
  const ed25519keypair = CreateED25519KeyPair();

  const publicKeyHex = ed25519keypair.publicKey
    .export({ format: "der", type: "spki" })
    .toString("hex")
    .toUpperCase();

  const privateKeyHex = ed25519keypair.privateKey
    .export({ format: "der", type: "pkcs8" })
    .toString("hex")
    .toUpperCase();

  const keypair = { publicKey: publicKeyHex, privateKey: privateKeyHex };

  return keypair;
}

// Convert hex back to key
export function hexToKey(hexString, keyType) {
  return keyType === "private"
    ? crypto.createPrivateKey({
        key: Buffer.from(hexString, "hex"),
        format: "der",
        type: "pkcs8",
      })
    : crypto.createPublicKey({
        key: Buffer.from(hexString, "hex"),
        format: "der",
        type: "spki",
      });
}

// Convert key to hex
export function keyToHex(key) {
  return key
    .export({
      type: key.type === "private" ? "pkcs8" : "spki",
      format: "der",
    })
    .toString("hex")
    .toUpperCase();
}
