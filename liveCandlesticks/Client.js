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

  ensureConnection() {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }

      this.connect();
      const timer = setInterval(() => {
        if (this.isConnected) {
          resolve(true);
          clearInterval(timer);
        }
      }, 1000);
    });
  }

  async getChart(exchange, baseAsset, quoteAsset, interval) {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      this.socket.emit("getChart", exchange, baseAsset, quoteAsset, interval, (candles) => {
        resolve(candles);
      });
    });
  }
};
