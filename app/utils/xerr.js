export default class XErr {
    constructor(errcode, errdata, errmsg) {
      this.errcode = errcode;
      this.errdata = errdata;
      this.errmsg = errmsg;
    }
  
    NewData(newdata) {
      return new XErr(this.errcode, newdata, this.errmsg);
    }
  }
  