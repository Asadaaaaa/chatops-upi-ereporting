import StartCommand from "./Start.command.js";
import DummyFlow from "./DummyFlow.command.js";

class HandlerCommand {
  constructor(Main) {
    this.Main = Main;
    this.TeleBot = this.Main.TeleBot;

    this.TeleBot.on('message', (ctx) => {
      new DummyFlow(this.Main, ctx)
      // new StartCommand(this.Main, ctx)
    });
  }
}

export default HandlerCommand;