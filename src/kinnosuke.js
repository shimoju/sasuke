import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';
import { JSDOM } from 'jsdom';
import { URLSearchParams } from 'url';

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

  async getTimeSheet() {
    const doc = await this.getWithLogin('/?module=timesheet&action=browse');
    const table = doc.getElementById('total_list0');

    return table;
  }

  async getWithLogin(path) {
    const firstTry = await this.http.get(path);
    const loginButtonId = 'id_passlogin';

    if (firstTry.data.includes(loginButtonId)) {
      const login = await this.login();
      const retry = await this.http.get(path);

      return (new JSDOM(retry.data)).window.document;
    } else {
      return (new JSDOM(firstTry.data)).window.document;
    }
  }

  async login() {
    const response = await this.http.post('/', this.loginParams());

    return response;
  }

  loginParams() {
    const params = new URLSearchParams({
      module: 'login',
      y_companycd: this.companyId,
      y_logincd: this.loginId,
      password: this.password,
    });

    return params.toString();
  }
};
