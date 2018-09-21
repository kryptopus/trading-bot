const tulind = require('tulind');

module.exports = class Signal {
  constructor(candlestickFetcher) {
    this.candlestickFetcher = candlestickFetcher;
  }

  async isValidated(exchange, baseAsset, quoteAsset, parameters) {
    const candles = await this.candlestickFetcher.fetchLastCandles(exchange, baseAsset, quoteAsset, "1h", 200);
    const total = candles.length;
    const closes = candles.map(candle => candle.close);
    const [macd, signal, histogram] = await tulind.indicators.macd.indicator([closes], [12, 26, 9]);
    console.log("total", total);
    console.log("macd", macd[macd.length - 1], "signal", signal[signal.length - 1], "histogram",
                histogram[histogram.length - 1]);

    return false;
  }
}
