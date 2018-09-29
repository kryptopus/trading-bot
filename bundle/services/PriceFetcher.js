module.exports = class PriceFetcher {
  constructor(candlestickFetcher) {
    this.candlestickFetcher = candlestickFetcher;
  }

  async fetch(exchangeSymbol) {
    const candles = await this.candlestickFetcher.fetchLastCandles(exchangeSymbol, "5m", 1);
    if (candles.length < 1) {
      const { exchange, baseAsset, quoteAsset } = exchangeSymbol;
      throw new Error(`Unable to fetch price: ${exchange} ${baseAsset} ${quoteAsset}`);
    }
    return candles[0].close;
  }
}
