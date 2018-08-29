"use strict";
const Database = require("./Database");
const BinanceFetcher = require("./binance/Fetcher");

const database = new Database();
const binanceFetcher = new BinanceFetcher(database);
binanceFetcher.fetch();

const Server = require("socket.io");
const io = new Server(3000, {
  path: "/",
  serverClient: false
});
io.on("connection", (socket) => {
  socket.on("getChart", (exchange, baseAsset, quoteAsset, interval, callback) => {
    console.log("getChart", exchange, baseAsset, quoteAsset, interval);
    const chart = database.getChart(exchange, baseAsset, quoteAsset, interval);
    callback(chart);
  });
});



