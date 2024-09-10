// Models
import MasterdataIKUModel from "../models/MasterdataIKU.model.js";

import { Markup } from "telegraf";

class DummyFlow {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;

    // Init Model
    this.MasterdataIKUModel = new MasterdataIKUModel(Main).table;
    
    this.run(ctx);
  }

  async run(ctx) {
    let command = '';
    if(ctx.message.text) command = ctx.message.text.split(' ')[0];

    switch(command) {
      case '/start':
        ctx.reply('Halo 👋, @' + ctx.message.from.username + '. Selamat datang di UPI E-Reporting Group.\n\n' +
          'Harap lakukan registrasi untuk menggunakan fitur pelaporan terlebih dahulu dengan mengetik command\n/register'
        );
        break;

      case '/register':
        ctx.reply('Untuk: @' + ctx.message.from.username + '. \n\nSilahkan kirim NIP anda untuk melakukan registrasi');
        break;

      case '/menu': {
        const getMenu = await this.showMenu();
        const menutText = getMenu.map((menu) => `${menu.nomor}. ${menu.nama}`).join('\n');
        const buttons = getMenu.map((menu) => Markup.button.callback('IKU-' + menu.nomor, menu.uuid));
        const buttonRows = [];
        for (let i = 0; i < buttons.length; i += 3) {
          buttonRows.push(buttons.slice(i, i + 3));
        }

        ctx.telegram.sendMessage(ctx.message.chat.id,
          'For: @' + ctx.message.from.username + '\n\n' +
          'List IKU:\n'
          + menutText + '\n\n' +
          'Pilih IKU dengan klik tombol dibawah ini:',
          
          Markup.inlineKeyboard(buttonRows)
        );

        break;
      }

      case '/export': {
        const getMenu = await this.showMenu();
        const menutText = getMenu.map((menu) => `${menu.nomor}. ${menu.nama}`).join('\n');
        const buttons = getMenu.map((menu) => Markup.button.callback('IKU-' + menu.nomor, menu.uuid));
        const buttonRows = [];
        for (let i = 0; i < buttons.length; i += 3) {
          buttonRows.push(buttons.slice(i, i + 3));
        }

        ctx.telegram.sendMessage(ctx.message.chat.id,
          'Untuk: @' + ctx.message.from.username + '\n\n' +
          'List IKU:\n'
          + menutText + '\n\n' +
          'Pilih IKU yang ingin anda export dengan klik tombol dibawah ini:',
          
          Markup.inlineKeyboard(buttonRows)
        );

        break;
      }

      default:
        // send file from /server_data/IKU-2_Export.xlsx
        ctx.replyWithDocument({ source: process.cwd() + '/server_data/IKU-2_Export.xlsx' });
        /* ctx.telegram.sendMessage(ctx.message.chat.id,
          'Untuk: @' + ctx.message.from.username + '\n\n' + 
          'Pelaporan Selesai\n\n' + 
          'Pelaporan: IKU-21 | Dosen Tetap Yang Memiliki Sertifikat Kompetensi/Profesi Yang Diakui Oleh Industri dan Dunia Kerja\n' +
          'Kode Periode: 20243\n' +
          'Kode Periode: Triwulan III 2024\n' +
          'Kode Unit Kerja: 310010\n' +
          'Unit Kerja: Kampus UPI di Cibiru\n' +
          'Kode Program Studi: G5051\n' +
          'Program Studi: Rekayasa Perangkat Lunak - S1\n' +
          'NIP Dosen: 920190219920507101\n' +
          'Nama Dosen: Raditya Muhammad, ST., M.T.\n' +
          'Bidang Kompetensi: Kompetensi\n' +
          'Tahun Perolehan: 2024\n' +
          'Keterangan: Lorem ipsum dolor sit amet\n' +
          'File Pendukung: ✅\n\n' +
          // 'Harap kirim file pendukung berupa file atau link\n\n'
          'Ketik /menu untuk melihat menu pelaporan | ketik /export untuk mengekspor data pelaporan'
        ); */

        // Markup.inlineKeyboard([
        //   [Markup.button.callback('Kompetensi', 'kompetensi')],
        //   [Markup.button.callback('Profesi', 'kompetensi')],
        // ])
        return;
    }
  }

  async showMenu() {
    const getMasterdataIKU = await this.MasterdataIKUModel.findAll({
      where: {
        is_active: true
      },
      attributes: ['uuid', 'nomor', 'nama']
    });
    return getMasterdataIKU; 
  }
}

export default DummyFlow;