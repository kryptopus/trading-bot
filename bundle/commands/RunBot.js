const minimist = require("minimist");
const AbstractCommand = require("@solfege/cli/lib/Command/AbstractCommand");
const ExchangeSymbol = require("../model/ExchangeSymbol");
const wait = require("../utils/wait");

const STATUS_WAITING_BUY_SIGNAL = "waiting buy signal";
const STATUS_BUYING = "buying";
const STATUS_SESSION_STARTED = "session started";
const STATUS_SESSION_ENDED = "session ended";

module.exports = class ExecuteBot extends AbstractCommand {
  constructor(serviceContainer, config) {
    super();

    this.serviceContainer = serviceContainer;
    this.config = config;
  }

  async configure() {
    this.setName("bot:run");
    this.setDescription("Run a bot");
  }

  async execute(parameters) {
    const [id, exchange, baseAsset, quoteAsset] = parameters;
    const botConfig = this.config[id];
    const exchangeSymbol = new ExchangeSymbol(exchange, baseAsset, quoteAsset);

    let iteration = 1;
    while (true) {
      await this.start(
        iteration,
        exchangeSymbol,
        botConfig
      );
      await wait(1);
      iteration++;
    }
  }

  async start(iteration, exchangeSymbol, config) {
    const argv = minimist(process.argv.slice(2));
    const entrySignalParameters = { ...config.entrySignal, ...argv };
    const entryStrategyParameters = { ...config.entryStrategy, ...argv };

    console.log(`${iteration} | ${new Date().toISOString()} > START`);

    await this.isEntrySignalValidated(exchangeSymbol, entrySignalParameters);
    console.log(`${iteration} | ${new Date().toISOString()} > VALIDATED ENTRY SIGNAL`);

    const entry = await this.createEntry(exchangeSymbol, entryStrategyParameters);
    while (true) {
      if (await this.isExitValidated(exchangeSymbol, config.exitSignals, argv)) {
        await entry.cancel();
        console.log(`${iteration} | ${new Date().toISOString()} > EXIT`);
        return;
      }

      if (await entry.isFilled()) {
        break;
      }
      await wait(1);
    }
    console.log(`${iteration} | ${new Date().toISOString()} > POSITIONED`);

    const {id:takeProfitStrategyId, ...takeProfitStrategyParameters} = config.takeProfitStrategy;
    const takeProfitStrategy = await this.serviceContainer.get(takeProfitStrategyId);
    const takeProfit = await takeProfitStrategy.create(entry, takeProfitStrategyParameters);
    while (true) {
      if (await takeProfit.isFilled()) {
        break;
      }

      if (await this.isExitValidated(exchangeSymbol, config.exitSignals, argv)) {
        await takeProfit.cancel();
        console.log(`${iteration} | ${new Date().toISOString()} > EXIT`);
        return;
      }
      await wait(1);
    }

    console.log(`${iteration} | ${new Date().toISOString()} > FILLED`);
  }

  async isEntrySignalValidated(exchangeSymbol, configEntrySignal) {
    const {id:entrySignalId, ...entrySignalParameters} = configEntrySignal;
    const entrySignal = await this.serviceContainer.get(entrySignalId);
    while (true) {
      if (await entrySignal.isValidated(exchangeSymbol, entrySignalParameters)) {
        break;
      }
      await wait(1);
    }

    return true;
  }

  async createEntry(exchangeSymbol, configEntryStrategy) {
    const {id:entryStrategyId, ...entryStrategyParameters} = configEntryStrategy;
    const entryStrategy = await this.serviceContainer.get(entryStrategyId);
    return await entryStrategy.create(exchangeSymbol, entryStrategyParameters);
  }

  async isExitValidated(exchangeSymbol, configExitSignals, argv) {
    for (let configExitSignal of configExitSignals) {
      const {id, ...exitSignalParameters} = configExitSignal;
      const exitSignal = await this.serviceContainer.get(id);
      const isValidated = await exitSignal.isValidated(exchangeSymbol, { ...exitSignalParameters, ...argv });
      if (isValidated) {
        return true;
      }
    }

    return false;
  }
};
