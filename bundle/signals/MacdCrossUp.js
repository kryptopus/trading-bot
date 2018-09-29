const tulind = require('tulind');

module.exports = class Signal {
  constructor(candlestickFetcher) {
    this.candlestickFetcher = candlestickFetcher;
  }

  async isValidated(exchangeSymbol, parameters) {
    const candles = await this.candlestickFetcher.fetchLastCandles(exchangeSymbol, "5m", 1000);

    const closes = candles.map(candle => candle.close);
    const [macd, signal, histogram] = await tulind.indicators.macd.indicator([closes], [12, 26, 9]);
    const count = macd.length;

    const previousMacd = macd[count - 2];
    const previousSignal = signal[count - 2];

    const lastMacd = macd[count - 1];
    const lastSignal = signal[count - 1];
    if (lastMacd > lastSignal && previousMacd < previousSignal) {
      return true;
    }

    return false;
  }
}
