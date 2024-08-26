export function CheckIfKeysExist(targobj, keylist) {
  for (const idx in keylist) {
    const eachkey = keylist[idx];
    if (!(eachkey in targobj)) {
      return new Error("Key:" + eachkey + " is missing");
    }
  }
  return null;
}
