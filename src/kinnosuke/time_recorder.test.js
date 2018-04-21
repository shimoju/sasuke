import TimeRecorder from './time_recorder';

let timeRecorder;

beforeEach(() => {
  timeRecorder = new TimeRecorder('clockIn', 'clockOut', 'goOut', 'goBack');
});

describe('#test', () => {
  test('test', () => {
    expect(timeRecorder.clockIn).toBe('clockIn');
    expect(timeRecorder.clockOut).toBe('clockOut');
    expect(timeRecorder.goOut).toBe('goOut');
    expect(timeRecorder.goBack).toBe('goBack');
  });
});
