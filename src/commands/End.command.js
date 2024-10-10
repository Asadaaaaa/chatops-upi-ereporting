import UserService from "../repositories/User.repository.js";
import UserModel from "../models/User.model.js";
import userService from "../repositories/User.repository.js";

class EndCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.UserRepository = new userService(this.Main);
    this.state(ctx);
  }

  async state(ctx) {
    if (ctx.state.user.state !== 'stop') {
      ctx.state.user.state = 'stop';
      await this.UserRepository.saveState(ctx.message.from.username, ctx.state.user.state);
      if(ctx.message.text.startsWith('/stop')) return await this.endCmd(ctx);
    }
  }
  

  async endCmd(context) {
    if(context.state.user.state === 'stop') {
      return context.reply('Untuk @' + context.message.from.username + '.\n\n' +
        'Terima kasih telah menggunakan bot E-reporting'
      );
    }
  }
}

export default EndCommand;