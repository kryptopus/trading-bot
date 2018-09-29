const TakeProfit = require("../model/TakeProfit");

module.exports = class SinglePercent {
  async create(entry, parameters) {
    const exchange = entry.getExchange();
    const baseQuantity = entry.getBaseQuantity();
    const price = entry.getPrice();
    const baseAsset = entry.getBaseAsset();
    const quoteAsset = entry.getQuoteAsset();

    const orders = await exchange.sellAtLimitByBaseQuantity(
        baseAsset,
        quoteAsset,
        baseQuantity,
        price
      );
    }

    const takeProfit = new TakeProfit(orders);

    return takeProfit;

  }
}
