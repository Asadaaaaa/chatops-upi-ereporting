import UsersModel from "../models/User.model.js";

class HandlerMiddleware {
  constructor(Main) {
    this.Main = Main;
    this.TeleBot = this.Main.TeleBot;

    this.UsersModel = new UsersModel(this.Main).table;

    this.global();
  }

  global() {
    this.TeleBot.use(async (ctx, next) => {
      if(this.Main.env.LOG_REQUEST === 'full') {
        this.Main.Logger('Received Message: \n' + JSON.stringify({
          chatId: ctx.message.chat.id,
          messageId: ctx.message.message_id,
          username: ctx.message.from.username,
          text: ctx.message.text,
          date: new Date(ctx.message.date).toISOString()
        }, null, 2));
      } else if(this.Main.env.LOG_REQUEST === 'medium') {
        this.Main.Logger('Received Message from ' + ctx.message.chat.id + ' - ' + ctx.message.from.username);
      }
      
      const getUserModel = await this.UsersModel.findOne({ where: { chat_id: ctx.message.chat.id } });
      if(!getUserModel) {
        ctx.state.user = {
          state: "start-new",
          data: {}
        }
      }
      
      return next();
    });
  }
}

export default HandlerMiddleware;