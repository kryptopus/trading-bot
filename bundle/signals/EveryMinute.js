module.exports = class Signal {
  async isValidated(exchangeSymbol, parameters) {
    const now = new Date();

    if (now.getSeconds() === 0) {
      return true;
    }

    return false;
  }
}
