module.exports = class Entry {
  constructor(orders) {
    this.orders = orders;
  }

  getExchange() {
    for (let order of this.orders) {
      return order.exchange;
    }

    throw new Error("No exchange found for the entry");
  }

  getBaseQuantity() {
    let sumBaseQuantity = 0;
    for (let order of this.orders) {
      sumBaseQuantity += order.baseQuantity;
    }

    return sumBaseQuantity;
  }

  getPrice() {
    let sum = 0;
    let sumBaseQuantity = 0;
    for (let order of this.orders) {
      sumBaseQuantity += order.baseQuantity;
      sum += order.baseQuantity * order.price;
    }

    return sum / sumBaseQuantity;
  }

  getBaseAsset() {
    for (let order of this.orders) {
      return order.baseAsset;
    }

    throw new Error("No base asset found for the entry");
  }


  getQuoteAsset() {
    for (let order of this.orders) {
      return order.quoteAsset;
    }

    throw new Error("No quote asset found for the entry");
  }

  async isFilled() {
    for (let order of this.orders) {
      if (!await order.isFilled()) {
        return false;
      }
    }
    return true;
  }

  async cancel() {
    for (let order of this.orders) {
      await order.cancel();
    }
    await this.exit();
  }

  async exit() {

  }
};
