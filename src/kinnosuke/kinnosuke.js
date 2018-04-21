import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';
import { URLSearchParams } from 'url';
import { JSDOM } from 'jsdom';
import TimeRecorder from './time_recorder';
import TimeSheet from './time_sheet';

const CLOCK_IN = '1';
const CLOCK_OUT = '2';
const GO_OUT = '3';
const GO_BACK = '4';
const LOGIN_BUTTON = 'id_passlogin';
const IP_RESTRICTION = 'IPアドレス制限により';

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

  async clockIn() {
    return await this.clock(CLOCK_IN);
  }

  async clockOut() {
    return await this.clock(CLOCK_OUT);
  }

  async goOut() {
    return await this.clock(GO_OUT);
  }

  async goBack() {
    return await this.clock(GO_BACK);
  }

  async clock(clockType) {
    const clockPage = await this.login();

    if (clockPage.data.includes(IP_RESTRICTION)) {
      return Promise.reject(new Error('Unauthorized IP address'));
    }

    const csrfToken = scrapeCSRFToken(clockPage.data);
    if (!csrfToken) {
      return Promise.reject(new Error('CSRF token not found'));
    }

    const response = await this.http.post(
      '/',
      this.clockParams(clockType, csrfToken)
    );

    const doc = parseDOM(response.data);
    const elements = doc.querySelectorAll('#timerecorder_txt');

    const recorder = {
      clockIn: null,
      clockOut: null,
      goOut: null,
      goBack: null,
    };

    for (let element of elements) {
      const text = element.innerHTML;
      if (text.includes('出社')) {
        recorder.clockIn = text;
      } else if (text.includes('退社')) {
        recorder.clockOut = text;
      }
    }

    return new TimeRecorder(
      recorder.clockIn,
      recorder.clockOut,
      recorder.goOut,
      recorder.goBack
    );
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
    const response = await this.http.post('/', this.loginParams());

    if (response.data.includes(LOGIN_BUTTON)) {
      return Promise.reject(new Error('Incorrect login id or password'));
    }

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

  clockParams(clockType, csrfToken) {
    const params = new URLSearchParams({
      module: 'timerecorder',
      action: 'timerecorder',
      scrollbody: '0',
      timerecorder_stamping_type: clockType,
      [csrfToken.key]: csrfToken.value,
    });

    return params.toString();
  }
}

function parseDOM(data) {
  return new JSDOM(data).window.document;
}

function scrapeCSRFToken(data) {
  const result = data.match(/name="(__sectag_[\da-f]+)" value="([\da-f]+)"/);

  if (result && result.length === 3) {
    return { key: result[1], value: result[2] };
  }

  return null;
}
