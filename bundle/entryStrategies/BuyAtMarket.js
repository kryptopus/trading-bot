const Entry = require("../model/Entry");

module.exports = class BuyAtMarket {
  constructor(exchangeFactory) {
    this.exchangeFactory = exchangeFactory;
  }

  async create(exchangeSymbol, parameters) {
    const exchange = await this.exchangeFactory.create(exchangeSymbol.exchange);

    let orders = [];
    if (parameters.quoteQuantity) {
      orders = await exchange.buyAtMarketByQuoteQuantity(
        exchangeSymbol.baseAsset,
        exchangeSymbol.quoteAsset,
        parameters.quoteQuantity
      );
    }

    const entry = new Entry(orders);

    return entry;
  }
};
