import TimeRecorder from './time_recorder';

let timeRecorder;

beforeEach(() => {
  timeRecorder = new TimeRecorder('clockIn', 'clockOut', 'goOut', 'goBack');
});

// TODO: きちんと実装するときに消す
describe('#test', () => {
  test('test', () => {
    expect(timeRecorder.clockIn).toBe('clockIn');
    expect(timeRecorder.clockOut).toBe('clockOut');
    expect(timeRecorder.goOut).toBe('goOut');
    expect(timeRecorder.goBack).toBe('goBack');
  });
});
