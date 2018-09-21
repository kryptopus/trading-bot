const Client = require("../../liveCandlesticks/Client");

module.exports = class CandlestickFetcher {
  constructor() {
    this.client = new Client;
    this.client.connect();
  }

  async fetchLastCandles(exchange, baseAsset, quoteAsset, interval = "1m", count = 10) {
    const candles = await this.client.getChart(exchange, baseAsset, quoteAsset, interval);
    if (candles.length > count) {
      return candles.slice(-count);
    }
    return candles;
  }
};
