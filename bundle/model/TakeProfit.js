module.exports = class TakeProfit {
  constructor(orders) {
    this.orders = orders;
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
  }
}
