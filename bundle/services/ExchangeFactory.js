const Binance = require("../exchanges/Binance");

module.exports = class ExchangeFactory {
  constructor(priceFetcher, config) {
    this.priceFetcher = priceFetcher;
    this.config = config;
  }

  async create(id) {
    if (!this.config[id]) {
      throw new Error(`Exchange "${id}" does not exist`);
    }

    const { type, ...parameters } = this.config[id];
    switch (type) {
      case "binance": {
        const { apiKey, apiSecret } = parameters;
        const exchange  = new Binance(apiKey, apiSecret, this.priceFetcher);
        return exchange;
      }
    }

    throw new Error(`Unknown exchange type "${type}"`);
  }
}
