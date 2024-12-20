import UserService from "../repositories/User.repository.js";
import {checkCommand, checkUsername} from "../helpers/CommandCheck.helper.js";

class RegisterCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.UserService = new UserService(this.Main);
    this.state(ctx);
  }

  async state(ctx) {
    if (ctx.state.user.state !== 'stop') {
      const command  = checkCommand(ctx);
      if(command === '/register') {
        return this.registerCmd(ctx);
      }
      return this.startRegister(ctx);
    }
  }

  async registerCmd(context) {
    console.log(context.message.from);
    if(context.state.user.state === 'register') {
      return this.startRegister(context);
    }
    if (!checkUsername(context)) {
      return context.reply('Untuk'+context.message.from.first_name + ' '+context.message.from.last_name+'\n\nAnda tidak memiliki username telegram. Silahkan atur username anda.');
    }
    const user = await this.UserService.getUser(context.message.from.username);
    if (user) {
      const registered = await this.UserService.checkUserDosen(context.message.from.username);
      if (registered) {
        await this.UserService.saveState(context.message.from.username, 'idle');
        return context.reply('Untuk: @' + context.message.from.username + '. \n\nAnda telah melakukan registrasi dengan nama dosen: \n'+registered.nama);
      }
      context.state.user.state = 'register';
      await this.UserService.saveState(context.message.from.username, context.state.user.state);
      return context.reply('Untuk: @' + context.message.from.username + '. \n\nSilahkan kirim NIP anda untuk melakukan registrasi');
    } else {
      return context.reply('Untuk: @' + context.message.from.username + '. \n\nSilahkan mulai dengan /start terlebih dahulu');
    }
  }

  async startRegister(context) {
    const register = await this.UserService.registerDosen(context.message.from.username, context.message.text);
    if (register.status === 'not-found') return context.reply('Untuk: @' + context.message.from.username + '. \n\nData dosen tidak ditemukan. Silahkan Coba Lagi');
    if (register.status === 'registered') return context.reply('Untuk: @' + context.message.from.username + '. \n\nDosen telah terdaftar. Silahkan Coba Lagi');

    await this.UserService.saveState(context.message.from.username, 'idle');

    return context.reply('Untuk: @' + context.message.from.username + '. \n\nRegistrasi sukses. Anda terdaftar dengan Nama \n' + register.data.nama +'\n\n'
      +'Untuk memulai pelaporan, silahkan ketik command /menu'
    );

  }
}

export default RegisterCommand;