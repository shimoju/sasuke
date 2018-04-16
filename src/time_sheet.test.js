import TimeSheet from './time_sheet';

let timeSheet;

beforeEach(() => {
  timeSheet = new TimeSheet('foo');
});

describe('#test', () => {
  test('test', () => {
    expect(timeSheet.test).toBe('foo');
  });
});
