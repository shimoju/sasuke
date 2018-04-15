import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';

export default class Kinnosuke {
  constructor(companyId, loginId, password, baseUrl = 'https://www.4628.jp') {
    this.companyId = companyId;
    this.loginId = loginId;
    this.password = password;
    this.baseUrl = baseUrl;
    this.cookieJar = new tough.CookieJar();
    this.http = axios.create({
      baseURL: this.baseUrl,
      jar: this.cookieJar,
      responseType: 'document',
      timeout: 3000,
      withCredentials: true,
    });
    axiosCookieJarSupport(this.http);
  }
  }
};
