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
        iku: null,
        periode: null,
        page: 1,
        lastMessageId: []
      };
      await this.UserRepository.saveState(this.username, ctx.state.user.state, stateData);
      ctx.state.user = await this.UserRepository.getCurrentState(this.username);
    }
    if (ctx.state.user.state === 'stop') {
      return ctx.reply('Untuk: @' + ctx.message.from.username + '. \n\n'
        + 'Untuk memulai penggunaan bot, silahkan ketik command \/start\n\n'
      );
    }
    await this.deletePreviousMessage(ctx);
    if (checkCommand(ctx).startsWith('/export')) return this.exportCmd(ctx);
    if (checkCommand(ctx).startsWith('iku')) return this.handleIku(ctx);
    if (checkCommand(ctx).startsWith('next_') || checkCommand(ctx).startsWith('prev')) {
      const data = checkCommand(ctx);
      const page = parseInt(data.split('_')[1]);
      return this.selectQuarters(ctx, page);
    }
    if (checkCommand(ctx).startsWith('Q')) return this.handlePeriod(ctx);
    return this.notAButtonMessage(ctx);
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
      const message =  await context.reply(
        'Untuk: @' + this.username + '\n\n' +
        'List IKU:\n'
        + menutText + '\n\n' +
        'Pilih IKU yang akan diexport dengan klik tombol dibawah ini:',

        Markup.inlineKeyboard(buttonRows)
      );
      context.state.user.data.lastMessageId.push(message.message_id);
      context.state.user.data.status = 'select-period'
      await this.UserRepository.saveState(this.username, context.state.user.state, context.state.user.data);
      return;
    }
    return context.reply('Untuk @' + context.message.from.username + '.\n\n' +
      'Silahkan selesaikan terlebih dahulu aktifitas anda\n\n'+
      'Untuk menghentikan penggunaan bot, silahkan ketik command \/stop'
    );
  }

  async handleIku(context) {
    context.state.user.data.iku = checkCommand(context);
    await this.UserRepository.saveState(this.username, context.state.user.state, context.state.user.data );

    return this.selectQuarters(context, 1);
  }

  async selectQuarters(context, page = 1) {
    const limit = 5;
    const offset = (page - 1) * limit;

    const {quarters, total} = await this.IkuRepository.getQuarterLists(limit, offset);
    const totalPages = Math.ceil(total / limit);

    const quarterMap = {
      Q1: 'Triwulan I',
      Q2: 'Triwulan II',
      Q3: 'Triwulan III',
      Q4: 'Triwulan IV'
    };

    const quarterButtons = quarters.map(quarter => {
      const quarterKey = quarter.split('-');
      const q = quarterKey[1];
      const year = quarterKey[0];
      return [
        {
          text: `${quarterMap[q]} ${year}`,
          callback_data: `${q}-${year}`
        }
      ];
    });

    // Add pagination buttons
    if (page > 1) {
      quarterButtons.push([
        {
          text: '<< Sebelumnya',
          callback_data: `prev_${page - 1}`
        }
      ]);
    }
    if (page < totalPages) {
      quarterButtons.push([
        {
          text: 'Berikutnya >>',
          callback_data: `next_${page + 1}`
        }
      ]);
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: quarterButtons
      }
    };

    const message = await context.reply(`Untuk @${this.username}. \n\nSilahkan pilih triwulan:`, keyboard);

    context.state.user.data.lastMessageId.push(message.message_id);
    await this.UserRepository.saveState(this.username, context.state.user.state, context.state.user.data);
  }

  async handlePeriod(context) {
    context.state.user.data.status = 'export';
    context.state.user.data.periode = checkCommand(context);
    await this.UserRepository.saveState(this.username, context.state.user.state, context.state.user.data);

    return this.startExport(context);
  }

  async startExport(context) {
    try {
      const period = checkCommand(context);
      if (context.state.user.data.status === 'export') {
        context.state.user.data.status = 'running';
        await this.UserRepository.saveState(this.username, context.state.user.state, context.state.user.data );
      }
      const dataIku = await this.IkuRepository.getFormData(context.state.user.data.iku, context.state.user.data.periode);
      if (dataIku.status === false) {
        throw new Error(dataIku.message);
      }
      const file = await genereateExcel(dataIku.label, dataIku.formData, dataIku.excelHeader, dataIku.excelSheet);

      await this.UserRepository.saveState(this.username, 'idle', {});
      return context.replyWithDocument(
        { source: file , filename: 'data-'+context.state.user.data.iku+'.xlsx'},
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

  async deletePreviousMessage(ctx) {
    if (ctx.state.user.data.lastMessageId && ctx.state.user.data.lastMessageId.length > 0 ) {
      ctx.state.user.data.lastMessageId.forEach(async (value) => {
        try {
          await ctx.deleteMessage(value);
        } catch (error) {
          console.error('Failed to delete message:', error);
        }
      })
      ctx.state.user.data.lastMessageId = [];
      await this.UserRepository.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
    }
  }

  async notAButtonMessage(ctx) {
    const message = await ctx.reply(`Untuk @${this.username}. \n\nPilihan tidak tersedia, silahkan coba lagi`);
    ctx.state.user.data.lastMessageId.push(message.message_id);
    await this.UserRepository.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
    if (ctx.state.user.data.status === 'select-period') {
      return this.selectQuarters(ctx, 1);
    }
    return this.exportCmd(ctx);
  }

}

export default ExportCommand;