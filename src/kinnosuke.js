import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';
// import { JSDOM } from 'jsdom';
import { URLSearchParams } from 'url';

const LOGIN_BUTTON_ID = 'id_passlogin';

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

  async getWithLogin(path) {
    const firstTry = await this.http.get(path);

    if (firstTry.data.includes(LOGIN_BUTTON_ID)) {
      await this.login();
      const retry = await this.http.get(path);

      return retry;
    } else {
      return firstTry;
    }
  }

  async login() {
    const response = await this.http.post('/', this.loginParams);

    if (response.data.includes(LOGIN_BUTTON_ID)) {
      return Promise.reject(new Error('Incorrect login id or password'));
    } else {
      return response;
    }
  }

  get loginParams() {
    const params = new URLSearchParams({
      module: 'login',
      y_companycd: this.companyId,
      y_logincd: this.loginId,
      password: this.password,
    });

    return params.toString();
  }
}
