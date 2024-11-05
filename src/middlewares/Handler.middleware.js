import UsersModel from "../models/User.model.js";
import UserRepository from "../repositories/User.repository.js";

class HandlerMiddleware {
  constructor(Main) {
    this.Main = Main;
    this.TeleBot = this.Main.TeleBot;

    this.UserRepository = new UserRepository(Main);

    this.global();
  }

  global() {
    this.TeleBot.use(async (ctx, next) => {
      // console.log(ctx);
      const context = this.checkContext(ctx);
      console.log(context);
      const chatId = context.chatId;
      const messageId = context.messageId;
      const username = context.username;
      const text = context.text;
      const date = context.date;
      console.log(date);
      if(this.Main.env.LOG_REQUEST === 'full') {
        this.Main.Logger('Received Message: \n' + JSON.stringify({
          chatId: chatId,
          messageId: messageId,
          username: username,
          text: text,
          date: new Date(date).toISOString()
        }, null, 2));
      } else if(this.Main.env.LOG_REQUEST === 'medium') {
        this.Main.Logger('Received Message from ' + chatId + ' - ' + username);
      }
      if (username) {
        const getUserModel = await this.UserRepository.getUser(username);
        if(!getUserModel) {
          ctx.state.user = {
            state: "start-new",
            data: {}
          }
          await this.UserRepository.registerUser(username, chatId);
        } else {
          ctx.state.user = JSON.parse(getUserModel.state);
        }
      } else {
        ctx.state.user = {
          state: "start-new",
          data: {}
        }
      }

      return next();
    });
  }

  checkContext(ctx) {
    console.log(ctx.update.callback_query);
    if (ctx.update.callback_query) {
      const callbackMessage = ctx.update.callback_query.message;
      return {
        chatId: callbackMessage.chat.id,
        messageId: callbackMessage.message_id,
        username: ctx.update.callback_query.from.username,
        text: ctx.update.callback_query.data,
        date: ctx.update.callback_query.message.date,
      };
    }
    if (ctx.update.edited_message) {
      const editedMessage = ctx.update.edited_message;
      return {
        chatId: editedMessage.chat.id,
        messageId: editedMessage.message_id,
        username: editedMessage.from.username,
        text: editedMessage.text,
        date: editedMessage.date,
      };
    }
    if (ctx.message) {
      return {
        chatId: ctx.message.chat.id,
        messageId: ctx.message.message_id,
        username: ctx.message.from.username,
        text: ctx.message.text,
        date: ctx.message.date,
      };
    }
    return {};
  }
}

export default HandlerMiddleware;