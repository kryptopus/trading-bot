module.exports = class Candlestick {
  constructor(openTime, closeTime, open, close, high, low, volume) {
    this.openTime = openTime;
    this.closeTime = closeTime;
    this.open = open;
    this.close = close;
    this.high = high;
    this.low = low;
    this.volume = volume;
  }
}
