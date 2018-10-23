const {inspect} = require("util");
const api = require("binance");
const BigNumber = require("bignumber.js");
const ExchangeSymbol = require("../model/ExchangeSymbol");
const Order = require("../model/Order");

module.exports = class Binance {
  constructor(apiKey, apiSecret, priceFetcher) {
    this.fee = 0.001;
    this.binanceRest = new api.BinanceRest({
      key: apiKey,
      secret: apiSecret
    });
    this.priceFetcher = priceFetcher;
    this.symbolDefinitions = null;
  }

  async fetchOrderById(baseAsset, quoteAsset, id) {
    const binanceOrder = await this.binanceRest.queryOrder({
      symbol: baseAsset + quoteAsset,
      orderId: id,
      timestamp: (new Date()).getTime()
    });
    return this.convertOrder(baseAsset, quoteAsset, binanceOrder);
  }

  async cancelOrder(baseAsset, quoteAsset, id) {
    await this.binanceRest.cancelOrder({
      symbol: baseAsset + quoteAsset,
      orderId: id,
      timestamp: (new Date()).getTime()
    });
  }

  async buyAtMarketByQuoteQuantity(baseAsset, quoteAsset, quoteQuantity) {
    const orderRequest = {
      symbol: baseAsset + quoteAsset,
      side: "BUY",
      type: "MARKET",
      quantity: await this.computeMaxBaseQuantityByQuoteQuantity(baseAsset, quoteAsset, quoteQuantity),
      newOrderRespType: "FULL",
      timestamp: (new Date()).getTime()
    };

    let binanceOrder;
    try {
      binanceOrder = await this.binanceRest.newOrder(orderRequest);
    } catch (error) {
      process.stderr.write(`Unable to buy: ${inspect(orderRequest)}\n`);
      throw new Error(`Unable to buy: ${error.msg} (Code ${error.code})`);
    }
    const order = this.convertOrder(baseAsset, quoteAsset, binanceOrder);
    return [order];
  }

  async sellAtLimitByBaseQuantity(baseAsset, quoteAsset, baseQuantity, price) {
    const orderRequest = {
      symbol: baseAsset + quoteAsset,
      side: "SELL",
      type: "LIMIT",
      timeInForce: "GTC",
      price: await this.computeMaxPrice(baseAsset, quoteAsset, price),
      quantity: baseQuantity,
      newOrderRespType: "FULL",
      timestamp: (new Date()).getTime()
    };


    let binanceOrder;
    try {
      binanceOrder = await this.binanceRest.newOrder(orderRequest);
    } catch (error) {
      process.stderr.write(`Unable to sell: ${inspect(orderRequest)}\n`);
      throw new Error(`Unable to sell: ${error.msg} (Code ${error.code})`);
    }
    const order = this.convertOrder(baseAsset, quoteAsset, binanceOrder);
    return [order];
  }

  async getSymbolDefinition(baseAsset, quoteAsset) {
    if (!this.symbolDefinitions) {
      const info = await this.binanceRest.exchangeInfo();
      this.symbolDefinitions = {};
      for (let symbolDefinition of info.symbols) {
        this.symbolDefinitions[symbolDefinition.symbol] = symbolDefinition;
      }
    }

    return this.symbolDefinitions[baseAsset + quoteAsset];
  }

  async computeMaxBaseQuantityByQuoteQuantity(baseAsset, quoteAsset, quoteQuantity) {
    const definition = await this.getSymbolDefinition(baseAsset, quoteAsset);
    const exchangeSymbol = new ExchangeSymbol("binance", baseAsset, quoteAsset);
    const lastPrice = await this.priceFetcher.fetch(exchangeSymbol);

    const stepSize = this.getDefinitionStepSize(definition);

    const quoteQuantityLimit = new BigNumber(this.applyFee(quoteQuantity));
    let baseQuantity = new BigNumber(0);
    let quoteSpent = new BigNumber(0);
    while (quoteSpent.isLessThan(quoteQuantityLimit)) {
      baseQuantity = baseQuantity.plus(stepSize);
      quoteSpent = baseQuantity.times(lastPrice);
    }
    baseQuantity = baseQuantity.minus(stepSize);

    return baseQuantity.toString();
  }

  async computeMaxPrice(baseAsset, quoteAsset, price) {
    const definition = await this.getSymbolDefinition(baseAsset, quoteAsset);
    const tickSize = this.getDefinitionTickSize(definition);

    const priceLimit = new BigNumber(price);
    let currentPrice = new BigNumber(0);
    while (currentPrice.isLessThan(priceLimit)) {
      currentPrice = currentPrice.plus(tickSize);
    }
    currentPrice = currentPrice.minus(tickSize);

    return currentPrice.toNumber();
  }

  getDefinitionStepSize(definition) {
    let stepSize = 0.001;
    if (Array.isArray(definition.filters)) {
      for (let index = 0; index < definition.filters.length; index++) {
        const filter = definition.filters[index];
        if (filter.filterType === "LOT_SIZE") {
          stepSize = Number(filter.stepSize);
        }
      }
    }
    return stepSize;
  }

  getDefinitionTickSize(definition) {
    let tickSize = 0.0001;
    if (Array.isArray(definition.filters)) {
      for (let index = 0; index < definition.filters.length; index++) {
        const filter = definition.filters[index];
        if (filter.filterType === "PRICE_FILTER") {
          tickSize = Number(filter.tickSize);
        }
      }
    }
    return tickSize;
  }

  getDefinitionBasePrecision(definition) {
    return definition.baseAssetPrecision;
  }

  applyFee(quantity) {
    return quantity * (1 - this.fee);
  }

  convertOrder(baseAsset, quoteAsset, binanceOrder) {
    const baseQuantity = Number(binanceOrder.origQty);
    const quoteQuantity = Number(binanceOrder.cummulativeQuoteQty);
    const status = binanceOrder.status;

    let price = Number(binanceOrder.price);
    if (!price) {
      price = quoteQuantity / baseQuantity;
    }

    let time = (new Date()).getTime();
    if (binanceOrder.time) {
      time = binanceOrder.time;
    } else if (binanceOrder.transactTime) {
      time = binanceOrder.transactTime;
    }

    return new Order(
      this,
      baseAsset,
      quoteAsset,
      binanceOrder.orderId,
      time,
      binanceOrder.side,
      binanceOrder.type,
      price,
      baseQuantity,
      quoteQuantity,
      status
    );
  }
}
