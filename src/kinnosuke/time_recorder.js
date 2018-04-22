export default class TimeRecorder {
  constructor(times) {
    this.clockIn = times.clockIn || null;
    this.clockOut = times.clockOut || null;
    this.goOut = times.goOut || null;
    this.goBack = times.goBack || null;
  }
}
