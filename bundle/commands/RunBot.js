const minimist = require("minimist");
const AbstractCommand = require("@solfege/cli/lib/Command/AbstractCommand");
const ExchangeSymbol = require("../model/ExchangeSymbol");
const wait = require("../utils/wait");

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
    while (iteration > 0) {
      try {
        await this.start(
          iteration,
          exchangeSymbol,
          botConfig
        );
      } catch (error) {
        process.stderr.write(`${iteration} | ${new Date().toISOString()} > FAIL: ${error.message}\n`);
      }
      await wait(1);
      iteration++;
    }
  }

  async start(iteration, exchangeSymbol, config) {
    const argv = minimist(process.argv.slice(2));
    const entrySignalParameters = { ...config.entrySignal, ...argv };
    const entryStrategyParameters = { ...config.entryStrategy, ...argv };

    process.stdout.write(`${iteration} | ${new Date().toISOString()} > START\n`);

    await this.isEntrySignalValidated(exchangeSymbol, entrySignalParameters);
    process.stdout.write(`${iteration} | ${new Date().toISOString()} > VALIDATED ENTRY SIGNAL\n`);

    const entry = await this.createEntry(exchangeSymbol, entryStrategyParameters);
    while (!await entry.isFilled()) {
      if (await this.isExitValidated(exchangeSymbol, config.exitSignals, argv)) {
        await entry.cancel();
        process.stdout.write(`${iteration} | ${new Date().toISOString()} > EXIT\n`);
        return;
      }

      await wait(1);
    }
    process.stdout.write(`${iteration} | ${new Date().toISOString()} > POSITIONED\n`);

    const {id:takeProfitStrategyId, ...takeProfitStrategyParameters} = config.takeProfitStrategy;
    const takeProfitStrategy = await this.serviceContainer.get(takeProfitStrategyId);
    const takeProfit = await takeProfitStrategy.create(entry, takeProfitStrategyParameters);
    while (!await takeProfit.isFilled()) {
      if (await this.isExitValidated(exchangeSymbol, config.exitSignals, argv)) {
        await takeProfit.cancel();
        process.stdout.write(`${iteration} | ${new Date().toISOString()} > EXIT\n`);
        return;
      }
      await wait(1);
    }

    process.stdout.write(`${iteration} | ${new Date().toISOString()} > FILLED\n`);
  }

  async isEntrySignalValidated(exchangeSymbol, configEntrySignal) {
    const {id:entrySignalId, ...entrySignalParameters} = configEntrySignal;
    const entrySignal = await this.serviceContainer.get(entrySignalId);
    while (!await entrySignal.isValidated(exchangeSymbol, entrySignalParameters)) {
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
