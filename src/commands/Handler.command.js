import StartCommand from "./Start.command.js";
import DummyFlow from "./DummyFlow.command.js";
import RegisterCommand from "./Register.command.js";
import MenuCommand from "./Menu.command.js";
import IkuServices from "../services/Iku.service.js";
import EndCommand from "./End.command.js";
import ExportCommand from "./Export.command.js";

class HandlerCommand {
  constructor(Main) {
    this.Main = Main;
    this.TeleBot = this.Main.TeleBot;

    this.TeleBot.on('new_chat_members',(ctx) => {
      ctx.message.new_chat_members.forEach(async (member) => {
        const username = member.username ? `@${member.username}` : member.first_name || ' ';

        // Send a welcome message mentioning their username
        await ctx.reply(`Halo 👋, @' ${username} '. Selamat datang di UPI E-Reporting Group.\\n\\n' +
        'Untuk mulai menggunakan bot E-Reporting ini, silahkan mengetik command\\n/start.`);
      });
    });

    this.TeleBot.start((ctx) => {
      // new DummyFlow(this.Main, ctx)
      new StartCommand(this.Main, ctx);
    });

    this.TeleBot.command('stop', (ctx) => {
      new EndCommand(this.Main, ctx);
    });

    this.TeleBot.command('register', (ctx) => {
      new RegisterCommand(this.Main, ctx);
    });

    this.TeleBot.command('menu', (ctx) => {
      new MenuCommand(this.Main, ctx);
    });

    this.TeleBot.command('export', (ctx) => {
      new ExportCommand(this.Main, ctx);
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
      if (ctx.state.user.state === 'export') {
        new ExportCommand(this.Main, ctx);
      }
    })

    this.TeleBot.on('callback_query', (ctx) => {
      if (ctx.state.user.data.status === 'running' || ctx.state.user.data.status === 'finishing') {
        new IkuServices(this.Main, ctx);
      }
      if (ctx.state.user.state === 'export') {
        new ExportCommand(this.Main, ctx);
      }
    })

    this.TeleBot.on('document', (ctx) => {
      console.log(ctx.state.user.state);
      if (ctx.state.user.data.status === 'running' || ctx.state.user.data.status === 'finishing') {
        new IkuServices(this.Main, ctx);
      }
    });
  }
}

export default HandlerCommand;