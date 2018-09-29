const Client = require("../../liveCandlesticks/Client");

module.exports = class CandlestickFetcher {
  constructor() {
    this.client = new Client;
    this.client.connect();
  }

  async fetchLastCandles(exchangeSymbol, interval = "5m", count = 10) {
    const { exchange, baseAsset, quoteAsset } = exchangeSymbol;
    const candles = await this.client.getChart(exchange, baseAsset, quoteAsset, interval);
    return candles.slice(-count);
  }
};
