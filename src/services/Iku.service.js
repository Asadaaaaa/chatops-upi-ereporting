import UserService from "../repositories/User.repository.js";
import IkuRepository from "../repositories/Iku.repository.js";
import {checkUsername, checkCommand} from "../helpers/CommandCheck.helper.js";
import FileService from "./File.service.js";
import {validateCurrency, validateDate, validateNim, validateYear} from "../helpers/Validator.helper.js";

class IkuService {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.UserService = new UserService(this.Main);
    this.IkuRepository = new IkuRepository(this.Main);
    this.username = checkUsername(ctx);
    this.state(ctx);
  }

  async state(ctx) {
    if (ctx.state.user.state === 'idle') {
      await this.deletePreviousMessage(ctx);
      await this.UserService.saveState(this.username, checkCommand(ctx) , {status: 'start', data_iku:{}, lastMessageId: []});
      ctx.state.user = await this.UserService.getCurrentState(this.username);
    }
    if (ctx.state.user.data.status === 'start') {
      return this.startProcess(ctx);
    }
    return this.handleUserInput(ctx);
  }

  async startProcess(context) {
    const iku = context.state.user.state.split('-');
    const iku_number = iku[1];

    const masterdata = await this.IkuRepository.getIkuData(iku_number);
    const form = this.setupForm(masterdata);
    context.state.user.data.status = 'running';
    context.state.user.data.data_iku = {
      formData: form,
      currentStep: 0,
      steps: Object.keys(form),
      fieldLabels: this.getFieldLabels(Object.keys(form)),
      selectableFields: this.getSelectableFields(masterdata.additional_data)
    }
    if (context.state.user.data.data_iku.formData.hasOwnProperty('dosen_id')) {
      const data = await this.IkuRepository.getProdiByUsername(this.username);
      context.state.user.data.data_iku.formData.program_studi_id = data.prodi.kode + ';' + data.prodi.nama;
      context.state.user.data.data_iku.formData.dosen_id = data.dosen.nip + ';' + data.dosen.nama;
    }
    await this.skipAutoFilledFields(context);
    await this.UserService.saveState(this.username, context.state.user.state, context.state.user.data);
    console.log(context.state.user.data.data_iku.fieldLabels);
    if (context.state.user.data.data_iku.currentStep < context.state.user.data.data_iku.steps.length) {
      await this.promptUserForNextInput(context);
    } else {
      await this.showFilledDataWithConfirmation(context);
    }
  }

  async skipAutoFilledFields(ctx) {
    const state = ctx.state.user.data.data_iku;
    let currentField = state.steps[state.currentStep];

    while (state.formData[currentField]) {
      state.currentStep++;
      if (state.currentStep >= state.steps.length) {
        return;
      }
      currentField = state.steps[state.currentStep];
    }
  }

  setupForm(data) {
    const dataIku = data.data || {};
    const additionalData = data.additional_data || {};
    const dynamicField = {};

    for (const key in additionalData) {
      if (additionalData.hasOwnProperty(key)) {
        dynamicField[key] = null
      }
    }
    return {...dataIku, ...dynamicField}
  }

  getFieldLabels(field) {
    let labels = [];
    for (let i = 0; i < field.length; i++) {
      labels[i] = this.getLabelName(field[i]);
    }
    return labels;
  }

  async handleUserInput(ctx) {
    if (ctx.state.user.data.status === 'running') {
      const state = ctx.state.user.data.data_iku;

      await this.deletePreviousMessage(ctx);
      const currentField = state.steps[state.currentStep];
      if (currentField.startsWith('file')) {
        if (ctx.message && ctx.message.document) {
          const fileService = new FileService(this.Main, ctx.state.user.state);
          const path =  await fileService.downloadFile(ctx.message.document);
          if (path === false) {
            const message = await ctx.reply(`Untuk @${this.username}. \n\nUpload file gagal. Silahkan upload ulang ${state.fieldLabels[state.currentStep]}:`);
            ctx.state.user.data.lastMessageId.push(message.message_id);
            await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
            return;
          }
          state.formData[currentField] = path;
        } else {
          const message = await ctx.reply(`Untuk @${this.username}. \n\nSilahkan upload ${state.fieldLabels[state.currentStep]}:`);
          ctx.state.user.data.lastMessageId.push(message.message_id);
          await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
          return;
        }
      } else if (currentField.startsWith('negara')) {
        if (ctx.update.callback_query) {
          state.formData['negara'] = checkCommand(ctx);
        } else {
          const searchTerm = checkCommand(ctx)
          const countries = await this.IkuRepository.getNegaraBySearch(searchTerm);
          console.log(countries);
          let message = '';
          if (countries.length !== 0) {
            const keyboard = {
              reply_markup: {
                inline_keyboard: countries.map(country => [
                  { text: country.negara, callback_data: country.no+';'+country.negara}
                ])
              }
            };
            message = await ctx.reply(`Untuk @${this.username}. \n\nSilahkan pilih opsi untuk nama negara:`, keyboard);
          } else {
            message = await ctx.reply(`Untuk @${this.username}. \n\nNama negara: "${searchTerm}" tidak ditemukan. Silahkan masukan kembali.`);
          }
          ctx.state.user.data.lastMessageId.push(message.message_id);
          await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
          return;
        }
      } else if (currentField.startsWith('program_studi_id') || currentField.startsWith('fakultas_id')) {
        if (ctx.update.callback_query) {
          state.formData[currentField] = ctx.update.callback_query.data;
        } else {
          return await this.notAButtonMessage(ctx)
        }
      } else {
        if (state.selectableFields[currentField]) {
          if (ctx.update.callback_query) {
            const selectedValue = ctx.update.callback_query.data;
            state.formData[currentField] = selectedValue;
          } else {
            return await this.notAButtonMessage(ctx)
          }
        } else {
          const userInput = checkCommand(ctx);
          if (!userInput) {
            return this.validatorMessage(ctx);
          }
          if ((currentField.startsWith('waktu') || currentField.startsWith('tanggal')) && !validateDate(userInput)) {
            return this.validatorMessage(ctx);
          }
          if (currentField.startsWith('jumlah_dana') && !validateCurrency(userInput)) {
            return this.validatorMessage(ctx);
          }
          if (currentField.startsWith('tahun') && !validateYear(userInput)) {
            return this.validatorMessage(ctx);
          }
          if (currentField.startsWith('mahasiswa_id') && !validateNim(userInput)) {
            return this.validatorMessage(ctx);
          }
          state.formData[currentField] = userInput;
        }
      }
      if (currentField === 'mahasiswa_id') {
        const mahasiswa = await this.IkuRepository.getMahasiswa(state.formData[currentField]);

        if (mahasiswa) {
          state.formData['nama_mahasiswa'] = mahasiswa.nama
          state.currentStep++
        }
      }
      state.currentStep++;
      state.isSent = false;
      await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);

      if (state.currentStep < state.steps.length) {
        await this.promptUserForNextInput(ctx);
      } else {
        await this.showFilledDataWithConfirmation(ctx);
      }
    } else {
      await this.handleUserConfirmation(ctx);
    }
  }

  async promptUserForNextInput(ctx) {
    const state = ctx.state.user.data.data_iku;
    const currentStep = state.currentStep;
    const nextField = state.steps[currentStep];
    const nextFieldLabel = state.fieldLabels[currentStep];
    // await this.deletePreviousMessage(ctx);

    if (state.selectableFields[nextField]) {
      const options = state.selectableFields[nextField];
      const keyboard = {
        reply_markup: {
          inline_keyboard: options.map(option => [{
            text: option.name,
            callback_data: option.name
          }])
        }
      };
      if (state.isSent) return;
      const message = await ctx.reply(`Untuk @${this.username}. \n\nSilahkan pilih opsi untuk ${nextFieldLabel}:`, keyboard);
      ctx.state.user.data.lastMessageId.push(message.message_id);
      await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
    } else if (nextField === 'program_studi_id'){
      const options = await this.IkuRepository.getProgramStudiOptions();
      const keyboard = {
        reply_markup: {
          inline_keyboard: options.map(option => [{
            text: option.nama,
            callback_data: option.kode + ';' + option.nama
          }])
        }
      };
      if (state.isSent) return;
      const message = await ctx.reply(`Untuk @${this.username}. \n\nSilahkan pilih opsi untuk ${nextFieldLabel}:`, keyboard);
      ctx.state.user.data.lastMessageId.push(message.message_id);
      await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
    } else if (nextField === 'fakultas_id'){
      const options = await this.IkuRepository.getFakultasOptions();
      const keyboard = {
        reply_markup: {
          inline_keyboard: options.map(option => [{
            text: option.nama,
            callback_data: option.kode + ';' + option.nama
          }])
        }
      };
      if (state.isSent) return;
      const message = await ctx.reply(`Untuk @${this.username}. \n\nSilahkan pilih opsi untuk ${nextFieldLabel}:`, keyboard);
      ctx.state.user.data.lastMessageId.push(message.message_id);
      await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
    } else if (nextField.startsWith('file')) {
      const message = await ctx.reply(`Untuk @${this.username}. \n\nSilahkan upload ${state.fieldLabels[state.currentStep]}:`);
      ctx.state.user.data.lastMessageId.push(message.message_id);
      await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
    } else {
      let textLabel = nextFieldLabel;
      if (nextFieldLabel === 'mahasiswa') {
        textLabel = 'NIM mahasiswa'
      }
      if (nextField.startsWith('waktu') || nextField.startsWith('tanggal')) {
        textLabel = nextFieldLabel + ' (Contoh: 1 Januari 2024)'
      }
      if (nextField.startsWith('jumlah_dana')) {
        textLabel = nextFieldLabel + ' (Contoh: 1.000.000)'
      }
      if (nextField.startsWith('tahun')) {
        textLabel = nextFieldLabel + ' (Contoh: 2024)'
      }
      if (state.isSent) return;
      const message = await ctx.reply(`Untuk @${this.username}. \n\nSilahkan Isi ${textLabel}:`);
      ctx.state.user.data.lastMessageId.push(message.message_id);
      await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
    }
  }

  getSelectableFields(additionalData) {
    const selectableFields = {};
    if (additionalData !== null) {
      for (const field in additionalData) {
        if (additionalData[field]) {
          selectableFields[field] = additionalData[field].map(option => ({
            no: option.no,
            name: option.nama
          }));
        }
      }
    }
    return selectableFields;
  }

  async showFilledDataWithConfirmation(ctx) {
    const state = ctx.state.user.data.data_iku;
    const filledData = state.formData;

    let dataReview = 'untuk @'+this.username+'\n\nData yang telah anda isi untuk '+ctx.state.user.state.toUpperCase()+' adalah:\n';
    for (const [key, value] of Object.entries(filledData)) {
      dataReview += `${this.getLabelName(key)}: ${value}\n`;
    }
    ctx.state.user.data.status = 'finishing';
    await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);

    const message = await ctx.reply(dataReview, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Simpan', callback_data: 'save' }],
          [{ text: 'Mulai Ulang', callback_data: 'start_over' }],
          [{ text: 'Batalkan', callback_data: 'cancel' }]
        ]
      }
    });
    ctx.state.user.data.lastMessageId.push(message.message_id);
    await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
  }

  async handleUserConfirmation(ctx) {
    const selectedOption = checkCommand(ctx);

    switch (selectedOption) {
      case 'save':
        const save = await this.IkuRepository.saveFormData(this.username, ctx);
        await this.UserService.saveState(this.username, 'idle', {});
        if (save) {
          return await ctx.reply('Untuk @'+this.username+'. \n\nData telah berhasil disimpan\n\nUntuk melakukan pengisian laporan, silahkan ketik command \/menu\n\n'
            + 'Untuk melakukan export data, silahkan ketik command \/export\n\n'
            + 'Untuk menghentikan penggunaan bot, silahkan ketik command \/stop\n\n'
          );
        } else {
          await this.deletePreviousMessage(ctx);
          return await ctx.reply('Untuk @'+this.username+'. \n\nData Gagal diproses, silahkan ulang kembali pengisian\n\n'
            + 'Untuk melakukan pengisian laporan, silahkan ketik command \/menu\n\n'
            + 'Untuk melakukan export data, silahkan ketik command \/export\n\n'
            + 'Untuk menghentikan penggunaan bot, silahkan ketik command \/stop\n\n'
          );
        }

      case 'start_over':
        await this.deletePreviousMessage(ctx);
        await this.UserService.saveState(this.username, ctx.state.user.state, { status: 'start', data_iku: {} });
        return await this.startProcess(ctx);

      case 'cancel':
        await this.deletePreviousMessage(ctx);
        await this.UserService.saveState(this.username, 'idle', {});
        return await ctx.reply('Untuk @'+this.username+'. \n\nPengisian laporan telah dibatalkan\n\nUntuk melakukan pengisian laporan, silahkan ketik command \/menu\n\n'
          + 'Untuk melakukan export data, silahkan ketik command \/export\n\n'
          + 'Untuk menghentikan penggunaan bot, silahkan ketik command \/stop\n\n'
        );

      default:
        return await ctx.reply(`Untuk @${this.username}. \n\n Pilihan tidak tersedia, silahkan coba lagi.\n\n`);
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
      await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
    }
  }

  async validatorMessage(ctx) {
    const state = ctx.state.user.data.data_iku;
    const message = await ctx.reply(`Untuk @${this.username}. \n\nHarap masukkan ${state.fieldLabels[state.currentStep]} dengan format yang sesuai`);
    ctx.state.user.data.lastMessageId.push(message.message_id);
    await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
  }

  async notAButtonMessage(ctx) {
    const message = await ctx.reply(`Untuk @${this.username}. \n\nPilihan tidak tersedia, silahkan coba lagi`);
    ctx.state.user.data.lastMessageId.push(message.message_id);
    await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);
    return await this.promptUserForNextInput(ctx);
  }

  getLabelName(fieldName) {
    let field = '';
    if (fieldName.endsWith("_id")) {
      field = fieldName.slice(0, -3);
    } else {
      field = fieldName
    }
    if (field === 'mahasiswa') field = 'NIM mahasiswa';
    return field.replace(/_/g, ' ');
  }

}

export default IkuService;