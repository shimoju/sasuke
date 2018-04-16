import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';
import { URLSearchParams } from 'url';
import { JSDOM } from 'jsdom';
import TimeSheet from './time_sheet';

const LOGIN_BUTTON = 'id_passlogin';

export default class Kinnosuke {
  constructor(companyId, loginId, password, baseURL = 'https://www.4628.jp') {
    this.companyId = companyId;
    this.loginId = loginId;
    this.password = password;
    this.baseURL = baseURL;
    this.cookieJar = new tough.CookieJar();
    this.http = axios.create({
      baseURL: this.baseURL,
      jar: this.cookieJar,
      responseType: 'document',
      timeout: 3000,
      withCredentials: true,
    });
    axiosCookieJarSupport(this.http);
  }

  async getTimeSheet() {
    const response = await this.getWithLogin(
      '/?module=timesheet&action=browse'
    );
    const doc = parseDOM(response.data);
    // 日次のデータが入っているtableにはidがついていないため、親要素を取得
    const dailyList = doc.getElementById('submit_form0');
    const totalList = doc.getElementById('total_list0');

    if (dailyList && totalList) {
      return new TimeSheet(dailyList, totalList);
    }

    return Promise.reject(new Error('Unexpected element'));
  }

  async getWithLogin(path) {
    const firstTry = await this.http.get(path);

    if (firstTry.data.includes(LOGIN_BUTTON)) {
      await this.login();
      const retry = await this.http.get(path);

      return retry;
    }

    return firstTry;
  }

  async login() {
    const response = await this.http.post('/', this.loginParams);

    if (response.data.includes(LOGIN_BUTTON)) {
      return Promise.reject(new Error('Incorrect login id or password'));
    }

    return response;
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

function parseDOM(data) {
  return new JSDOM(data).window.document;
}
