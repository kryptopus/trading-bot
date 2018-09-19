const AbstractCommand = require("@solfege/cli/lib/Command/AbstractCommand");
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

    let iteration = 1;
    while (true) {
      await this.start(
        iteration,
        exchange,
        baseAsset,
        quoteAsset,
        botConfig,
      );
      await wait(1);
      iteration++;
    }
  }

  async start(iteration, exchange, baseAsset, quoteAsset, config) {
    console.log(`[${iteration}] START`);

    const {id:entrySignalId, ...entrySignalParameters} = config.entrySignal;
    const entrySignal = await this.serviceContainer.get(entrySignalId);
    while (true) {
      if (await entrySignal.isValidated(exchange, baseAsset, quoteAsset, entrySignalParameters)) {
        break;
      }
      await wait(1);
    }

    console.log(`[${iteration}] VALIDATED ENTRY SIGNAL`);

    const {id:entryStrategyId, ...entryStrategyParameters} = config.entryStrategy;
    const entryStrategy = await this.serviceContainer.get(entryStrategyId);
    const entry = await entryStrategy.create(exchange, baseAsset, quoteAsset, entryStrategyParameters);
    while (true) {
      if (await this.isExitValidated(exchange, baseAsset, quoteAsset, config.exitSignals)) {
        await entry.cancel();
        console.log(`[${iteration}] EXIT`);
        return;
      }

      if (await entry.isFilled()) {
        break;
      }
      await wait(1);
    }

    console.log(`[${iteration}] POSITIONNED`);

    const {id:takeProfitStrategyId, ...takeProfitStrategyParameters} = config.takeProfitStrategy;
    const takeProfitStrategy = await this.serviceContainer.get(takeProfitStrategyId);
    const takeProfit = await takeProfitStrategy.create(entry, takeProfitStrategyParameters);
    while (true) {
      if (await takeProfit.isFilled()) {
        break;
      }

      if (await this.isExitValidated(exchange, baseAsset, quoteAsset, config.exitSignals)) {
        await takeProfit.cancel();
        console.log(`[${iteration}] EXIT`);
        return;
      }
      await wait(1);
    }

    console.log(`[${iteration}] FILLED`);
  }

  async isExitValidated(exchange, baseAsset, quoteAsset, configExitSignals) {
    for ({exitSignalId, ...exitSignalParameters} of configExitSignals) {

      const entrySignal = await this.serviceContainer.get(exitSignalId);
      const isValidated = await exitSignal.isValidated(exchange, baseAsset, quoteAsset);
      if (isValidated) {
        return true;
      }
    }

    return false;
  }
};
