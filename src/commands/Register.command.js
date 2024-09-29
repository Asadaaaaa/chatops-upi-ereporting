import UserService from "../services/User.service.js";
import {checkCommand, checkUsername} from "../helpers/CommandCheck.helper.js";

class RegisterCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.UserService = new UserService(this.Main);
    this.state(ctx);
  }

  async state(ctx) {
    const command  = checkCommand(ctx);
    if(command === '/register') return this.registerCmd(ctx);
    return this.startRegister(ctx);
  }

  async registerCmd(context) {
    if(context.state.user.state === 'register') {
      return this.startRegister(context);
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
    console.log(context);
    const register = await this.UserService.registerDosen(context.message.from.username, context.message.text);
    if (!register) return context.reply('Untuk: @' + context.message.from.username + '. \n\nData dosen tidak ditemukan. Silahkan Coba Lagi')
    await this.UserService.saveState(context.message.from.username, 'idle');
    return context.reply('Untuk: @' + context.message.from.username + '. \n\nRegistrasi sukses. Anda terdaftar dengan Nama \n' + register.nama);

  }
}

export default RegisterCommand;