import Kinnosuke from './kinnosuke';

let client;

beforeEach(() => {
  client = new Kinnosuke('foo', 'bar', 'p@ssw0rd');
});

describe('baseUrl', () => {
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
