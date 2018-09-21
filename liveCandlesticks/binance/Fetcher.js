const axios = require("axios");
const api = require("binance");
const Candlestick = require("../Candlestick");
const binanceRest = new api.BinanceRest({});
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
      .then(async response => {
        const symbols = response.data.symbols;

        for (let symbol of symbols) {
          const { baseAsset, quoteAsset } = symbol;

          await this.fetchSymbol(baseAsset, quoteAsset, "5m");
          await this.fetchSymbol(baseAsset, quoteAsset, "15m");
          await this.fetchSymbol(baseAsset, quoteAsset, "30m");
          await this.fetchSymbol(baseAsset, quoteAsset, "1h");

          console.log(`Create websockets ${baseAsset} ${quoteAsset}`);
          this.createWebsocket(baseAsset, quoteAsset, "5m");
          this.createWebsocket(baseAsset, quoteAsset, "15m");
          this.createWebsocket(baseAsset, quoteAsset, "30m");
          this.createWebsocket(baseAsset, quoteAsset, "1h");
        }
      })
      .then(() => {
        console.log("Binance fetched");
      });
  }

  async fetchSymbol(baseAsset, quoteAsset, interval) {
    console.log(`Fetch symbol ${baseAsset} ${quoteAsset} ${interval}`);
    const candles = await binanceRest.klines({
      symbol: baseAsset + quoteAsset,
      interval,
    });

    /*
    {
      openTime: 1536112800000,                                                                                                                               │
      open: '0.03887700',                                                                                                                                    │
      high: '0.03890000',                                                                                                                                    │
      low: '0.03871300',                                                                                                                                     │
      close: '0.03877300',                                                                                                                                   │
      volume: '6233.18200000',                                                                                                                               │
      closeTime: 1536116399999,                                                                                                                              │
      quoteAssetVolume: '241.93313130',                                                                                                                      │
      trades: 4724,                                                                                                                                          │
      takerBaseAssetVolume: '3256.93200000',                                                                                                                 │
      takerQuoteAssetVolume: '126.42735935',                                                                                                                 │
      ignored: '0'
    }
    */
    candles.pop();
    for (let candle of candles) {
      this.collect(baseAsset, quoteAsset, interval, {
        startTime: candle.openTime,
        endTime: candle.closeTime,
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        volume: candle.volume,
        final: true,
      });
    }
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
    this.database.addCandlestick("binance", baseAsset, quoteAsset, interval, candlestick);
  }

  createWebsocket(baseAsset, quoteAsset, interval) {
    const symbol = baseAsset + quoteAsset;

    const ws = binanceWS.onKline(symbol, interval, data => {
      this.collect(baseAsset, quoteAsset, interval, data.kline);
    });
    ws.on("close", () => {
      this.createWebsocket(baseAsset, quoteAsset, interval);
    });
  }
};
