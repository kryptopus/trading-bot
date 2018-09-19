module.exports = class SignalValidationRequest {
  constructor(exchange, baseAsset, quoteAsset, time) {
    this.exchange = exchange;
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    this.time = time;
    this.parameters = new Map;
  }

  setParameters(values) {
    this.parameters = new Map(values);
  }

  setParameter(name, value) {
    this.parameters.set(name, value);
  }

  getParameter(name) {
    this.parameters.get(name);
  }
};
