import Kinnosuke from './kinnosuke';
import MockAdapter from 'axios-mock-adapter';

let client;
let mock;
// set-cookieヘッダがundefinedだとaxios-cookiejar-supportがエラーを出すので定義しておく
const mockHeaders = { 'set-cookie': null };

beforeEach(() => {
  client = new Kinnosuke('foo', 'bar', 'p@ssw0rd');
  mock = new MockAdapter(client.http);
});

describe('#baseUrl', () => {
  describe('引数を省略したとき', () => {
    test('デフォルト値が設定される', () => {
      expect(client.baseUrl).toBe('https://www.4628.jp');
    });
  });

  describe('引数を指定したとき', () => {
    beforeEach(() => {
      client = new Kinnosuke('foo', 'bar', 'p@ssw0rd', 'https://example.com');
    });

    test('指定した値が設定される', () => {
      expect(client.baseUrl).toBe('https://example.com');
    });
  });
});

describe('#getWithLogin', () => {
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

      const response = await client.getWithLogin(
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

      const response = await client.getWithLogin(
        '/?module=timesheet&action=browse'
      );
      expect(response.status).toBe(200);
      expect(response.data).toMatch('total_list0');
    });
  });
});

describe('#login', () => {
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

      const response = await client.login();
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

      await client.login();
      const retry = await client.login();
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

      const response = await client.login().catch(error => {
        expect(error.name).toBe('Error');
        expect(error.message).toBe('Incorrect login id or password');
      });
    });
  });
});

describe('#loginParams', () => {
  test('ログインに必要なパラメータをapplication/x-www-form-urlencoded形式の文字列で返す', () => {
    expect(client.loginParams()).toBe(
      'module=login&y_companycd=foo&y_logincd=bar&password=p%40ssw0rd'
    );
  });
});
