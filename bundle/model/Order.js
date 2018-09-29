module.exports = class Order {
  constructor(exchange, baseAsset, quoteAsset, id, time, side, type, price, baseQuantity, quoteQuantity, status) {
    this.exchange = exchange;
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    this.id = id;
    this.side = side;
    this.type = type;
    this.price = price;
    this.baseQuantity = baseQuantity;
    this.quoteQuantity = quoteQuantity;
    this.status = status;
  }

  async isFilled() {
    if (this.status === "FILLED") {
      return true;
    }

    const updatedOrder = await this.exchange.fetchOrderById(this.baseAsset, this.quoteAsset, this.id);
    this.status = updatedOrder.status;
    if (this.status === "FILLED") {
      return true;
    }

    return false;
  }

  async cancel() {
    await this.exchange.cancelOrder(this.baseAsset, this.quoteAsset, this.id);
  }
}
