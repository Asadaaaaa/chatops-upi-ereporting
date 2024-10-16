import UserService from "../repositories/User.repository.js";
import UserModel from "../models/User.model.js";
import userService from "../repositories/User.repository.js";
import IkuRepository from "../repositories/Iku.repository.js";
import {Markup} from "telegraf";
import MenuRepository from "../repositories/Menu.repository.js";
import {checkCommand, checkUsername} from "../helpers/CommandCheck.helper.js";
import {genereateExcel} from "../helpers/ExcelGenerate.helper.js";

class ExportCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.UserRepository = new userService(this.Main);
    this.IkuRepository = new IkuRepository(this.Main);
    this.MenuRepository = new MenuRepository(this.Main);
    this.username = checkUsername(ctx);
    this.state(ctx);
  }

  async state(ctx) {
    if (ctx.state.user.state === 'idle') {
      ctx.state.user.state = 'export';
      const stateData = {
        status: 'start',
        iku: null
      };
      await this.UserRepository.saveState(this.username, ctx.state.user.state, stateData);
      ctx.state.user = await this.UserRepository.getCurrentState(this.username);
    }
    if(checkCommand(ctx).startsWith('/export')) return this.exportCmd(ctx);
    return this.startExport(ctx);
  }

  async exportCmd(context) {
    if(context.state.user.state === 'export') {
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
        'Pilih IKU yang akan diexport dengan klik tombol dibawah ini:',

        Markup.inlineKeyboard(buttonRows)
      );
    }
    return context.reply('Untuk @' + context.message.from.username + '.\n\n' +
      'Silahkan selesaikan terlebih dahulu aktifitas anda'
    );
  }

  async startExport(context) {
    try {
      const iku = checkCommand(context);
      if (context.state.user.data.status === 'start') {
        context.state.user.data.status = 'running';
        context.state.user.data.iku = iku;
        await this.UserRepository.saveState(this.username, context.state.user.state, context.state.user.data );
      }
      const dataIku = await this.IkuRepository.getForm(iku);
      const file = await genereateExcel(dataIku.label, dataIku.formData);

      await this.UserRepository.saveState(this.username, 'idle', {});
      return context.replyWithDocument(
        { source: file , filename: 'data-'+iku+'.xlsx'},
        {
          caption: 'Untuk @' + this.username + '.\n\n' + 'Berhasil export data.\n\n' +
            'Untuk memilih pelaporan, silahkan ketik command\n/menu\n\n' +
            'Untuk menghentikan penggunaan bot, silahkan ketik command\n/stop'
        }
      );
    } catch (e) {
      this.Main.Logger('Failed to export: ' + e);
      await this.UserRepository.saveState(this.username, 'idle', {});
      return context.reply('Untuk @' + this.username + '.\n\n' +
        'Gagal ekspor, silahkan coba lagi'
      );
    }

  }
}

export default ExportCommand;