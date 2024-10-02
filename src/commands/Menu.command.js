import MenuRepository from "../repositories/Menu.repository.js";
import {Markup} from "telegraf";

class MenuCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.MenuRepository = new MenuRepository(Main);
    this.state(ctx);
  }

  async state(ctx) {
    if(ctx.message.text.startsWith('/menu')) return this.menuCmd(ctx);
  }

  async menuCmd(context) {
    if(context.state.user.state !== 'idle') {
      return context.reply('Untuk: @' + context.message.from.username + '. \n\nSilahkan selesaikan terlebih dahulu aktifitas anda');
    }
    const getMenu = await this.MenuRepository.showMenu();
    const menutText = getMenu.map((menu) => `${menu.nomor}. ${menu.nama}`).join('\n');
    const buttons = getMenu.map((menu) => Markup.button.callback('IKU-' + menu.nomor, 'iku-' + menu.nomor));
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 3) {
      buttonRows.push(buttons.slice(i, i + 3));
    }

    return await context.telegram.sendMessage(context.message.chat.id,
      'Untuk: @' + context.message.from.username + '\n\n' +
      'List IKU:\n'
      + menutText + '\n\n' +
      'Pilih IKU dengan klik tombol dibawah ini:',

      Markup.inlineKeyboard(buttonRows)
    );

  }
}

export default MenuCommand;