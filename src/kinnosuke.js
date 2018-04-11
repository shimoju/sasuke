import axios from 'axios';

export default class Kinnosuke {
  constructor(companyId, loginId, password, baseUrl = 'https://www.4628.jp') {
    this.companyId = companyId;
    this.loginId = loginId;
    this.password = password;
    this.baseUrl = baseUrl;
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 3000
    });
  }
};
