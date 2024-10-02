import StartCommand from "./Start.command.js";
import DummyFlow from "./DummyFlow.command.js";
import RegisterCommand from "./Register.command.js";
import MenuCommand from "./Menu.command.js";
import IkuServices from "../services/Iku.service.js";

class HandlerCommand {
  constructor(Main) {
    this.Main = Main;
    this.TeleBot = this.Main.TeleBot;

    this.TeleBot.start((ctx) => {
      // new DummyFlow(this.Main, ctx)
      new StartCommand(this.Main, ctx);
    });

    this.TeleBot.command('register', (ctx) => {
      new RegisterCommand(this.Main, ctx);
    });

    this.TeleBot.command('menu', (ctx) => {
      new MenuCommand(this.Main, ctx);
    });

    this.TeleBot.on('text', (ctx) => {
      console.log(ctx.state);
      const currentState = ctx.state.user.state;
      if (currentState === 'register') {
        new RegisterCommand(this.Main, ctx);
      }
      const split = ctx.state.user.state.split('-');
      const currentIku = split[0]
      if (currentIku === 'iku') {
        new IkuServices(this.Main, ctx);
      }
    })

    this.TeleBot.action(/iku-*/, (ctx) => {
      console.log('masuk');
      if (ctx.state.user.state === 'idle') {
        new IkuServices(this.Main, ctx);
      }
    })

    this.TeleBot.on('callback_query', (ctx) => {
      if (ctx.state.user.data.status === 'running' || ctx.state.user.data.status === 'finishing') {
        new IkuServices(this.Main, ctx);
      }
    })
  }
}

export default HandlerCommand;