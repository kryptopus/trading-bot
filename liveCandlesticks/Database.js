module.exports = class Database {
  constructor() {
    this.exchanges = new Map();
  }

  addCandlestick(exchangeName, baseAsset, quoteAsset, interval, candle) {
    const chart = this.getChart(exchangeName, baseAsset, quoteAsset, interval);
    chart.push(candle);
  }

  getExchange(name) {
    if (this.exchanges.has(name)) {
      return this.exchanges.get(name);
    }

    const symbols = new Map();
    this.exchanges.set(name, symbols);
    return symbols;
  }

  getExchangeSymbol(exchangeName, baseAsset, quoteAsset) {
    const exchange = this.getExchange(exchangeName);

    const symbol = baseAsset + quoteAsset;
    if (exchange.has(symbol)) {
      return exchange.get(symbol);
    }

    const charts = new Map();
    exchange.set(symbol, charts);
    return charts;
  }

  getChart(exchangeName, baseAsset, quoteAsset, interval) {
    const symbol = this.getExchangeSymbol(exchangeName, baseAsset, quoteAsset);

    if (symbol.has(interval)) {
      return symbol.get(interval);
    }

    const candles = [];
    symbol.set(interval, candles);
    return candles;
  }
}
