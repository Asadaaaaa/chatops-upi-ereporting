// Helpers
import LoggerHelper from "./helpers/Logger.helper.js"

// Handlers
import HandlerModel from "./models/Handler.model.js";
import HandlerMiddleware from "./middlewares/Handler.middleware.js";
import HandlerCommand from "./commands/Handler.command.js";

// Libraries
import * as dotenv from 'dotenv';
import FS from 'fs-extra';
import { Telegraf } from "telegraf";

class Main {
  constructor() {
    this.Logger = LoggerHelper;
    this.FS = FS;

    // init dotenv
    dotenv.config();
    this.env = process.env;

    this.init();
  }

  async init() {
    // Initiate Server Data
    const serverDataPath = '/server_data';
    const resourceFolder = '/src/resources';

    if (!this.FS.existsSync(process.cwd() + serverDataPath)) {
      this.Logger('Initiate Server Data...');
      this.FS.mkdirSync(process.cwd() + serverDataPath);
      this.FS.copySync(process.cwd() + resourceFolder, process.cwd() + serverDataPath);
    }

    this.model = new HandlerModel(this);
    const isModelConnected = await this.model.connect();
    if(isModelConnected === -1) {
      this.Logger('Database Connection Failed!');
      return;
    }

    this.run();
  }

  async run() {
    this.TeleBot = new Telegraf(this.env.TELEGRAM_BOT_KEY);

    new HandlerMiddleware(this);
    new HandlerCommand(this);

    this.Logger('Launching Bot...');
    try{
      this.TeleBot.launch();
      if(this.TeleBot) this.TeleBot.telegram.getMe().then((res) => this.Logger(`Bot started on https://t.me/${res.username}`))
    } catch (error) {
      this.Logger('Error launching bot:');
      console.log(error); 
    }
  }
}

new Main();