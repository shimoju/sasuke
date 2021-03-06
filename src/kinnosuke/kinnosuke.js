import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';
import { URLSearchParams } from 'url';
import { JSDOM } from 'jsdom';
import TimeRecorder from './time_recorder';
import TimeSheet from './time_sheet';

const CLOCK_IN = { id: '1', name: 'clockIn' };
const CLOCK_OUT = { id: '2', name: 'clockOut' };
const GO_OUT = { id: '3', name: 'goOut' };
const GO_BACK = { id: '4', name: 'goBack' };
const LOGIN_BUTTON = 'id_passlogin';
const IP_ADDRESS_RESTRICTION = 'IPアドレス制限により';

export default class Kinnosuke {
  constructor(options) {
    this.companyId = options.companyId;
    this.loginId = options.loginId;
    this.password = options.password;
    this._http = axios.create({
      baseURL: options.baseURL || 'https://www.4628.jp',
      jar: new tough.CookieJar(),
      responseType: 'document',
      timeout: options.timeout || 3000,
      withCredentials: true,
    });
    axiosCookieJarSupport(this._http);
  }

  async clockIn() {
    return await this._clock(CLOCK_IN);
  }

  async clockOut() {
    return await this._clock(CLOCK_OUT);
  }

  async goOut() {
    return await this._clock(GO_OUT);
  }

  async goBack() {
    return await this._clock(GO_BACK);
  }

  async getTimeRecorder() {
    // IP制限のときは打刻していても時刻を取得できないため、打刻と同様にエラーを返す
    const response = await this._getTimeRecorderPage();

    return parseTimeRecorder(response.data);
  }

  async getTimeSheet() {
    const response = await this._getWithLogin(
      '/?module=timesheet&action=browse'
    );
    const doc = parseDOM(response.data);
    // TODO: querySelector使う
    const dailyList = doc.getElementById('submit_form0');
    const totalList = doc.getElementById('total_list0');

    if (dailyList && totalList) {
      // TODO: パースして適切なプロパティにしていく
      return new TimeSheet(dailyList, totalList);
    }

    return Promise.reject(new Error('Unexpected element'));
  }

  async _clock(clockType) {
    const recorder = await this._getTimeRecorderPage();

    const csrfToken = parseCSRFToken(recorder.data);
    if (!csrfToken) {
      return Promise.reject(new Error('CSRF token not found'));
    }

    const response = await this._http.post(
      '/',
      this._clockParams(clockType, csrfToken)
    );

    const timeRecorder = parseTimeRecorder(response.data);

    if (timeRecorder[clockType.name]) {
      return timeRecorder;
    }

    return Promise.reject(new Error('Failed to clock'));
  }

  async _getTimeRecorderPage() {
    const response = await this._login();

    if (response.data.includes(IP_ADDRESS_RESTRICTION)) {
      return Promise.reject(new Error('Unauthorized IP address'));
    }

    return response;
  }

  async _getWithLogin(path) {
    const firstTry = await this._http.get(path);

    if (firstTry.data.includes(LOGIN_BUTTON)) {
      await this._login();
      const retry = await this._http.get(path);

      return retry;
    }

    return firstTry;
  }

  async _login() {
    const response = await this._http.post('/', this._loginParams());

    if (response.data.includes(LOGIN_BUTTON)) {
      return Promise.reject(new Error('Incorrect login id or password'));
    }

    return response;
  }

  _loginParams() {
    const params = new URLSearchParams({
      module: 'login',
      y_companycd: this.companyId,
      y_logincd: this.loginId,
      password: this.password,
    });

    return params.toString();
  }

  _clockParams(clockType, csrfToken) {
    const params = new URLSearchParams({
      module: 'timerecorder',
      action: 'timerecorder',
      scrollbody: '0',
      timerecorder_stamping_type: clockType.id,
      [csrfToken.key]: csrfToken.value,
    });

    return params.toString();
  }
}

function parseDOM(data) {
  return new JSDOM(data).window.document;
}

function parseCSRFToken(data) {
  const result = data.match(/name="(__sectag_[\da-f]+)" value="([\da-f]+)"/);

  if (result && result.length === 3) {
    return { key: result[1], value: result[2] };
  }

  return null;
}

function parseTimeRecorder(data) {
  const doc = parseDOM(data);
  const elements = doc.querySelectorAll('#timerecorder_txt');
  const timeRecorder = new TimeRecorder({});
  const timeRegExp = /\d\d:\d\d/;

  // TODO: 外出・戻りのキーワードを確認して実装する
  for (let element of elements) {
    const text = element.innerHTML;
    if (text.includes('出社')) {
      const result = text.match(timeRegExp);
      if (result) {
        timeRecorder.clockIn = result[0];
      }
    } else if (text.includes('退社')) {
      const result = text.match(timeRegExp);
      if (result) {
        timeRecorder.clockOut = result[0];
      }
    }
  }

  return timeRecorder;
}
