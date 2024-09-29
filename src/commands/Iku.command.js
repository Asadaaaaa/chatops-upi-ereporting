import UserService from "../services/User.service.js";
import Iku2Command from "./iku_commands/Iku2.command.js";

class IkuCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    this.UserService = new UserService(this.Main);
    this.state(ctx);
  }

  async state(ctx) {
    return this.ikuCmd(ctx);
  }

  async ikuCmd(context) {
    let command = '';
    let username = '';
    if (context.update.callback_query) {
      command = context.update.callback_query.data;
      username = context.update.callback_query.from.username;
    } else {
      command = context.state.user.state;
      username = context.message.from.username;
    }
    return new Iku2Command(this.Main, context);

  }
}

export default IkuCommand;