import UserService from "../repositories/User.repository.js";
import UserModel from "../models/User.model.js";
import userService from "../repositories/User.repository.js";

class StartCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.UserRepository = new userService(this.Main);
    this.state(ctx);
  }

  async state(ctx) {
    const checkUserDosen = await this.UserRepository.checkUserDosen(ctx.message.from.username);
    if (checkUserDosen) {
      ctx.state.user.state = 'idle';
    } else {
      ctx.state.user.state = 'start-new';
    }
    await this.UserRepository.saveState(ctx.message.from.username, ctx.state.user.state);
    if(ctx.message.text.startsWith('/start')) return this.startCmd(ctx);
  }

  async startCmd(context) {
    if(context.state.user.state === 'start-new') {
      return context.reply('Halo 👋, @' + context.message.from.username + '. Selamat datang di UPI E-Reporting Group.\n\n' +
        'Harap lakukan registrasi untuk menggunakan fitur pelaporan terlebih dahulu dengan mengetik command\n/register\n\n' +
        'Untuk menghentikan penggunaan bot, silahkan ketik command\n/stop\n\n'
      );
    }
    if (context.state.user.state === 'idle') {
      return context.reply('Untuk @' + context.message.from.username + '. \n\n' +
        'Untuk memilih pelaporan, silahkan ketik command\n/menu\n\n' +
        'Untuk melakukan export data, silahkan ketik command\n/export\n\n' +
        'Untuk menghentikan penggunaan bot, silahkan ketik command\n/stop'
      );
    }

    return context.reply('Untuk @' + context.message.from.username + '.\n\n' +
      'Silahkan selesaikan terlebih dahulu aktifitas anda'
    );
  }
}

export default StartCommand;