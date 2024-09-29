import UserService from "../services/User.service.js";
import UserModel from "../models/User.model.js";
import userService from "../services/User.service.js";

class StartCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.UserService = new userService(this.Main);
    this.state(ctx);
  }

  async state(ctx) {
    ctx.state.user.state = 'start-new';
    await this.UserService.saveState(ctx.message.from.username, ctx.state.user.state);
    if(ctx.message.text === '/start') return this.startCmd(ctx);
  }

  async startCmd(context) {
    if(context.state.user.state === 'start-new') {
      return context.reply('Halo 👋, @' + context.message.from.username + '. Selamat datang di UPI E-Reporting Group.\n\n' +
        'Harap lakukan registrasi untuk menggunakan fitur pelaporan terlebih dahulu dengan mengetik command\n/register'
      );
    }
  }
}

export default StartCommand;