import UserService from "../repositories/User.repository.js";
import IkuRepository from "../repositories/Iku.repository.js";
import {checkUsername, checkCommand} from "../helpers/CommandCheck.helper.js";

class Iku2Command {
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
      await this.UserService.saveState(this.username, checkCommand(ctx) , {status: 'start', data_iku:{}});
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
      context.state.user.data.data_iku.formData.program_studi_id = data.prodi.kode;
      context.state.user.data.data_iku.formData.dosen_id = data.dosen.id;
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

    // Auto-skip if the current field is already filled (auto-filled or user-filled)
    while (state.formData[currentField]) {
      state.currentStep++;
      if (state.currentStep >= state.steps.length) {
        // If all fields are already filled, stop
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

      const currentField = state.steps[state.currentStep];

      if (state.selectableFields[currentField]) {
        const selectedValue = checkCommand(ctx);
        state.formData[currentField] = selectedValue;
      } else {
        const userInput = checkCommand(ctx);
        state.formData[currentField] = userInput;
      }

      state.currentStep++;
      await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);

      if (state.currentStep < state.steps.length) {
        await this.promptUserForNextInput(ctx);
      } else {
        // await this.UserService.saveState(this.username, 'idle', {});
        // await ctx.reply('Thank you! The form has been completed and saved.');
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

    if (state.selectableFields[nextField]) {
      const options = state.selectableFields[nextField];
      const keyboard = {
        reply_markup: {
          inline_keyboard: options.map(option => [{
            text: option.name,
            callback_data: option.name // Save `name` when selected
          }])
        }
      };
      await ctx.reply(`Please choose an option for ${nextFieldLabel}:`, keyboard);
    } else if (nextField === 'program_studi_id'){
      const options = await this.IkuRepository.getProgramStudiOptions();
      const keyboard = {
        reply_markup: {
          inline_keyboard: options.map(option => [{
            text: option.nama,
            callback_data: option.kode
          }])
        }
      };
      await ctx.reply(`Please choose an option for ${nextFieldLabel}:`, keyboard);
    } else if (nextField === 'fakultas_id'){
      const options = await this.IkuRepository.getFakultasOptions();
      const keyboard = {
        reply_markup: {
          inline_keyboard: options.map(option => [{
            text: option.nama,
            callback_data: option.kode
          }])
        }
      };
      await ctx.reply(`Please choose an option for ${nextFieldLabel}:`, keyboard);
    } else {
      let textLabel = nextFieldLabel;
      if (nextFieldLabel === 'mahasiswa') {
        textLabel = 'NIM mahasiswa'
      }
      await ctx.reply(`Please provide ${textLabel}:`);
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

    // Format filled data for display
    let dataReview = 'untuk @'+this.username+'\n\nData yang telah anda isi untuk '+ctx.state.user.state+' adalah:\n';
    for (const [key, value] of Object.entries(filledData)) {
      dataReview += `${this.getLabelName(key)}: ${value}\n`;
    }
    ctx.state.user.data.status = 'finishing';
    await this.UserService.saveState(this.username, ctx.state.user.state, ctx.state.user.data);

    // Display filled data and ask for confirmation
    await ctx.reply(dataReview, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Simpan', callback_data: 'save' }],
          [{ text: 'Mulai Ulang', callback_data: 'start_over' }],
          [{ text: 'Batalkan', callback_data: 'cancel' }]
        ]
      }
    });
  }

  async handleUserConfirmation(ctx) {
    const selectedOption = checkCommand(ctx);

    switch (selectedOption) {
      case 'save':
        // Save form data to the database
        const state = ctx.state.user.data.data_iku.formData;
        await this.UserService.saveState(this.username, 'idle', {});
        return await ctx.reply('Your data has been saved successfully!');

      case 'start_over':
        // Reset form and start again
        await this.UserService.saveState(this.username, ctx.state.user.state, { status: 'start', data_iku: {} });
        return await this.startProcess(ctx);

      case 'cancel':
        // Cancel and clear the form
        await this.UserService.saveState(this.username, 'idle', {});
        return await ctx.reply('Form filling has been cancelled.');

      default:
        return await ctx.reply('Invalid option. Please try again.');
    }
  }

  getLabelName(fieldName) {
    let field = '';
    if (fieldName.endsWith("_id")) {
      field = fieldName.slice(0, -3);
    } else {
      field = fieldName
    }
    return field.replace(/_/g, ' ');
  }

}

export default Iku2Command;