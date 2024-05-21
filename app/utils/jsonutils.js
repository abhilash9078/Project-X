export function CheckIfKeysExist(targobj, keylist) {
  for (let idx in keylist) {
    let eachkey = keylist[idx];
    if (!(eachkey in targobj)) {
      return new Error("Key:" + eachkey + " is missing");
    }
  }
  return null;
}
