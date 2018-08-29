const axios = require("axios");
const api = require("binance");
const Candlestick = require("../Candlestick");
const binanceWS = new api.BinanceWS();

module.exports = class Fetcher {
  constructor(database) {
    this.database = database;
  }

  fetch() {
    axios
      .get(`https://api.binance.com/api/v1/exchangeInfo`, {
        responseType: "json"
      })
      .then(response => {
        const symbols = response.data.symbols;

        for (let symbol of symbols) {
          this.createWebsocket(symbol.baseAsset, symbol.quoteAsset, "1m");
        }
      });
  }

  collect(baseAsset, quoteAsset, interval, candle) {
    const { startTime, endTime, open, close, high, low, volume, final } = candle;

    if (!final) {
      return;
    }

    const candlestick = new Candlestick(
      startTime,
      endTime,
      open,
      close,
      high,
      low,
      volume
    );
    this.database.addCandlestick("binance", baseAsset, quoteAsset, "1m", candlestick);
  }

  createWebsocket(baseAsset, quoteAsset, interval) {
    const symbol = baseAsset + quoteAsset;

    const ws = binanceWS.onKline(symbol, interval, data => {
      this.collect(baseAsset, quoteAsset, interval, data.kline);
    });
    ws.on("close", () => {
      console.error(`Websocket closed: ${symbol}`);
      this.createWebsocket(baseAsset, quoteAsset, interval);
    });
  }
};
