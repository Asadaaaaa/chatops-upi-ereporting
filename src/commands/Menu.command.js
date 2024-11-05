import MenuRepository from "../repositories/Menu.repository.js";
import {Markup} from "telegraf";
import UserRepository from "../repositories/User.repository.js";
import {checkUsername} from "../helpers/CommandCheck.helper.js";

class MenuCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.MenuRepository = new MenuRepository(Main);
    this.UserRepository = new UserRepository(Main);
    this.username = checkUsername(ctx);
    this.state(ctx);
  }

  async state(ctx) {
    if(ctx.message.text.startsWith('/menu') && ctx.state.user.state !== 'stop') return this.menuCmd(ctx);
    if (ctx.state.user.state === 'stop') {
      return ctx.reply('Untuk: @' + this.username + '. \n\n'
        + 'Untuk memulai penggunaan bot, silahkan ketik command \/start\n\n'
      );
    }
  }

  async menuCmd(context) {
    if(context.state.user.state !== 'idle') {
      return context.reply('Untuk: @' + this.username + '. \n\nSilahkan selesaikan terlebih dahulu aktifitas anda\n\n'
        + 'Untuk menghentikan penggunaan bot, silahkan ketik command \/stop\n\n'
      );
    }
    const getMenu = await this.MenuRepository.showMenu();
    const menutText = getMenu.map((menu) => `${menu.nomor}. ${menu.nama}`).join('\n');
    const buttons = getMenu.map((menu) => Markup.button.callback('IKU-' + menu.nomor, 'iku-' + menu.nomor));
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 3) {
      buttonRows.push(buttons.slice(i, i + 3));
    }

    const message =  await context.telegram.sendMessage(context.message.chat.id,
      'Untuk: @' + this.username + '\n\n' +
      'List IKU:\n'
      + menutText + '\n\n' +
      'Pilih IKU dengan klik tombol dibawah ini:',

      Markup.inlineKeyboard(buttonRows)
    );
    context.state.user.data.lastMessageId = [message.message_id];
    await this.UserRepository.saveState(this.username, 'idle', context.state.user.data);
  }
}

export default MenuCommand;