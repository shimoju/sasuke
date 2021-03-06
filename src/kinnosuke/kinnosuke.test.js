import Kinnosuke from './kinnosuke';
import MockAdapter from 'axios-mock-adapter';

let client;
let mock;
// set-cookieヘッダがundefinedだとaxios-cookiejar-supportがエラーを出すので定義しておく
const mockHeaders = { 'set-cookie': null };

beforeEach(() => {
  client = new Kinnosuke({
    companyId: 'foo',
    loginId: 'bar',
    password: 'p@ssw0rd',
  });

  mock = new MockAdapter(client._http);
});

describe('#getTimeRecorder', () => {
  describe('期待したHTML要素が返ってきたとき', () => {
    test('TimeRecorderを返す', async () => {
      expect.assertions(4);
      mock
        .onPost('/')
        .replyOnce(
          200,
          '<td align="center" nowrap=""><div id="timerecorder_txt">出社<br>(10:00)</div></td><td align="center" nowrap=""><div id="timerecorder_txt">退社<br>(19:00)</div></td>',
          mockHeaders
        );

      const recorder = await client.getTimeRecorder();
      expect(recorder.clockIn).toBe('10:00');
      expect(recorder.clockOut).toBe('19:00');
      expect(recorder.goOut).toBe(null);
      expect(recorder.goBack).toBe(null);
    });
  });

  describe('打刻していないとき', () => {
    test('打刻時刻がすべてnullのTimeRecorderを返す', async () => {
      expect.assertions(4);
      mock.onPost('/').replyOnce(200, '<table></table>', mockHeaders);

      const recorder = await client.getTimeRecorder();
      expect(recorder.clockIn).toBe(null);
      expect(recorder.clockOut).toBe(null);
      expect(recorder.goOut).toBe(null);
      expect(recorder.goBack).toBe(null);
    });
  });

  describe('IPアドレス制限のとき', () => {
    test('エラーを返す', async () => {
      expect.assertions(2);
      mock
        .onPost('/')
        .replyOnce(
          200,
          '<div class="txt_12_red">IPアドレス制限により<br>タイムレコーダーは使用できません。</div>',
          mockHeaders
        );

      await client.getTimeRecorder().catch(error => {
        expect(error.name).toBe('Error');
        expect(error.message).toBe('Unauthorized IP address');
      });
    });
  });
});

describe('#getTimeSheet', () => {
  describe('期待したHTML要素が返ってきたとき', () => {
    test('パースしてTimeSheetを返す', async () => {
      expect.assertions(2);
      mock
        .onGet('/?module=timesheet&action=browse')
        .reply(
          200,
          '<form name="submit_form0" id="submit_form0" action="./" method="post"></form><table border="0" cellpadding="3" cellspacing="1" class="txt_12" id="total_list0"></table>',
          mockHeaders
        );

      const timeSheet = await client.getTimeSheet();
      expect(timeSheet.daily).toBeTruthy();
      expect(timeSheet.total).toBeTruthy();
    });
  });

  describe('期待していないHTML要素が返ってきたとき', () => {
    test('エラーを返す', async () => {
      expect.assertions(2);
      mock
        .onGet('/?module=timesheet&action=browse')
        .reply(
          200,
          '<table border="0" cellpadding="3" cellspacing="1" class="txt_12" id="total_list0"></table>',
          mockHeaders
        );

      await client.getTimeSheet().catch(error => {
        expect(error.name).toBe('Error');
        expect(error.message).toBe('Unexpected element');
      });
    });
  });
});

describe('#_clock', () => {
  const clockOut = { id: '2', name: 'clockOut' };

  describe('正常に打刻できたとき', () => {
    test('TimeRecorderを返す', async () => {
      expect.assertions(4);
      mock
        .onPost('/')
        .replyOnce(
          200,
          '<input type="hidden" name="__sectag_123456" value="abcdef">',
          mockHeaders
        )
        .onPost('/')
        .reply(
          200,
          '<td align="center" nowrap=""><div id="timerecorder_txt">出社<br>(10:00)</div></td><td align="center" nowrap=""><div id="timerecorder_txt">退社<br>(19:00)</div></td>',
          mockHeaders
        );

      const recorder = await client._clock(clockOut);
      expect(recorder.clockIn).toBe('10:00');
      expect(recorder.clockOut).toBe('19:00');
      expect(recorder.goOut).toBe(null);
      expect(recorder.goBack).toBe(null);
    });
  });

  describe('IPアドレス制限のとき', () => {
    test('エラーを返す', async () => {
      expect.assertions(2);
      mock
        .onPost('/')
        .replyOnce(
          200,
          '<div class="txt_12_red">IPアドレス制限により<br>タイムレコーダーは使用できません。</div>',
          mockHeaders
        );

      await client._clock(clockOut).catch(error => {
        expect(error.name).toBe('Error');
        expect(error.message).toBe('Unauthorized IP address');
      });
    });
  });

  describe('CSRFトークンを取得できなかったとき', () => {
    test('エラーを返す', async () => {
      expect.assertions(2);
      mock
        .onPost('/')
        .replyOnce(
          200,
          '<input type="hidden" name="__unexpected_csrf_token" value="abcdef">',
          mockHeaders
        );

      await client._clock(clockOut).catch(error => {
        expect(error.name).toBe('Error');
        expect(error.message).toBe('CSRF token not found');
      });
    });
  });

  describe('打刻した時刻がレスポンスに含まれていないとき', () => {
    test('エラーを返す', async () => {
      expect.assertions(2);
      mock
        .onPost('/')
        .replyOnce(
          200,
          '<input type="hidden" name="__sectag_123456" value="abcdef">',
          mockHeaders
        )
        .onPost('/')
        .reply(
          200,
          '<td align="center" nowrap=""><div id="timerecorder_txt">出社<br>(10:00)</div></td>',
          mockHeaders
        );

      await client._clock(clockOut).catch(error => {
        expect(error.name).toBe('Error');
        expect(error.message).toBe('Failed to clock');
      });
    });
  });
});

describe('#_getWithLogin', () => {
  describe('ログインしていないとき', () => {
    test('ログインした上で指定されたパスのレスポンスを返す', async () => {
      expect.assertions(2);
      mock
        .onGet('/?module=timesheet&action=browse')
        .replyOnce(
          200,
          '<input type="submit" id="id_passlogin" name="Submit" value="ログイン">',
          mockHeaders
        )
        .onGet('/?module=timesheet&action=browse')
        .reply(
          200,
          '<table border="0" cellpadding="3" cellspacing="1" class="txt_12" id="total_list0"></table>',
          mockHeaders
        )
        .onPost('/')
        .reply(
          200,
          '<div id="main_header_top">トップページ</div>',
          mockHeaders
        );

      const response = await client._getWithLogin(
        '/?module=timesheet&action=browse'
      );
      expect(response.status).toBe(200);
      expect(response.data).toMatch('total_list0');
    });
  });

  describe('ログインしているとき', () => {
    test('そのままレスポンスを返す', async () => {
      expect.assertions(2);
      mock
        .onGet('/?module=timesheet&action=browse')
        .reply(
          200,
          '<table border="0" cellpadding="3" cellspacing="1" class="txt_12" id="total_list0"></table>',
          mockHeaders
        );

      const response = await client._getWithLogin(
        '/?module=timesheet&action=browse'
      );
      expect(response.status).toBe(200);
      expect(response.data).toMatch('total_list0');
    });
  });
});

describe('#_login', () => {
  describe('ログインしていないとき', () => {
    test('ログインする', async () => {
      expect.assertions(2);
      mock
        .onPost('/')
        .reply(
          200,
          '<div id="main_header_top">トップページ</div>',
          mockHeaders
        );

      const response = await client._login();
      expect(response.status).toBe(200);
      expect(response.data).not.toMatch('id_passlogin');
    });
  });

  describe('既にログインしているとき', () => {
    test('問題なくログイン状態でレスポンスが返る', async () => {
      expect.assertions(2);
      mock
        .onPost('/')
        .reply(
          200,
          '<div id="main_header_top">トップページ</div>',
          mockHeaders
        );

      await client._login();
      const retry = await client._login();
      expect(retry.status).toBe(200);
      expect(retry.data).not.toMatch('id_passlogin');
    });
  });

  describe('ID・パスワードが正しくないとき', () => {
    test('エラーを返す', async () => {
      expect.assertions(2);
      mock
        .onPost('/')
        .reply(
          200,
          '<input type="submit" id="id_passlogin" name="Submit" value="ログイン">',
          mockHeaders
        );

      await client._login().catch(error => {
        expect(error.name).toBe('Error');
        expect(error.message).toBe('Incorrect login id or password');
      });
    });
  });
});

describe('#_loginParams', () => {
  test('ログインに必要なパラメータをapplication/x-www-form-urlencoded形式の文字列で返す', () => {
    expect(client._loginParams()).toBe(
      'module=login&y_companycd=foo&y_logincd=bar&password=p%40ssw0rd'
    );
  });
});

describe('#_clockParams', () => {
  test('打刻に必要なパラメータをapplication/x-www-form-urlencoded形式の文字列で返す', () => {
    const clockType = { id: '1', name: 'clockIn' };
    const csrfToken = { key: '__sectag_123456', value: 'abcdef' };

    expect(client._clockParams(clockType, csrfToken)).toBe(
      'module=timerecorder&action=timerecorder&scrollbody=0&timerecorder_stamping_type=1&__sectag_123456=abcdef'
    );
  });
});
