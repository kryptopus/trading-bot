/**
 * Ecosystem file for PM2
 *
 * @see https://pm2.io/doc/en/runtime/reference/ecosystem-file/
 */
module.exports = {
  apps: [
    {
      script: "server.js",
      cwd: `${__dirname}/liveCandlesticks`,
      name: "liveCandlesticks"
    }
  ]
};
