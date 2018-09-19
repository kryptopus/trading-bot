module.exports = class Signal {
  constructor(candlestickFetcher) {
    this.candlestickFetcher = candlestickFetcher;
  }

  isValidated(exchange, baseAsset, quoteAsset, time, parameters) {
    const candles = this.candlestickFetcher.fetchLastCandles(exchange, baseAsset, quoteAsset, "1m", 100);
    console.log("aaa", parameters, candles);

    return false;
  }
}
