import Kinnosuke from './kinnosuke';

test('default baseUrl', () => {
  const client = new Kinnosuke('foo', 'bar', 'password');
  expect(client.baseUrl).toBe('https://www.4628.jp');
});
