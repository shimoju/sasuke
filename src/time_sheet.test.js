import TimeSheet from './time_sheet';

let timeSheet;

beforeEach(() => {
  timeSheet = new TimeSheet('daily', 'total');
});

describe('#test', () => {
  test('test', () => {
    expect(timeSheet.daily).toBe('daily');
    expect(timeSheet.total).toBe('total');
  });
});
