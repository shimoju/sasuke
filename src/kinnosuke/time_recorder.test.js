import TimeRecorder from './time_recorder';

let timeRecorder;

beforeEach(() => {
  timeRecorder = new TimeRecorder({
    clockIn: '10:00',
    clockOut: '19:00',
    goOut: null,
    goBack: null,
  });
});

describe('#constructor', () => {
  describe('空のオブジェクトを渡したとき', () => {
    test('打刻時刻がすべてnullのTimeRecorderを返す', () => {
      timeRecorder = new TimeRecorder({});

      expect(timeRecorder.clockIn).toBeNull();
      expect(timeRecorder.clockOut).toBeNull();
      expect(timeRecorder.goOut).toBeNull();
      expect(timeRecorder.goBack).toBeNull();
    });
  });
});
