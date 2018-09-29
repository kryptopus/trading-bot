module.exports = class ExchangeSymbol {
  constructor(exchange, baseAsset, quoteAsset) {
    this.exchange = exchange;
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
  }
};
