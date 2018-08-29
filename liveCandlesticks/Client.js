const io = require("socket.io-client");

module.exports = class Client {
  constructor() {
    this.isConnected = false;
  }

  connect() {
    this.socket = io("http://localhost:3000", {
      path: "/",
    });
    this.socket.on("connect", () => {
      this.isConnected = true;
    });
  }

  getChart(exchange, baseAsset, quoteAsset, interval) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return;
      }

      this.socket.emit("getChart", exchange, baseAsset, quoteAsset, interval, (candles) => {
        resolve(candles);
      });
    });
  }
};
