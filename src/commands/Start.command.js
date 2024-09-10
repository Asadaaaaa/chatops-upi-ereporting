class StartCommand {
  constructor(Main, ctx) {
    this.Main = Main;
    this.TeleBot = Main.TeleBot;
    
    this.state(ctx);
  }

  async state(ctx) {
    ctx.state.user.state = 'start-new';

    if(ctx.message.text === '/start') return this.run(ctx);
  }

  async startCmd(context) {
    if(context.state.user.state === 'start-new') {
      context.state.user.state = 'start-new';
      return context.send('Hello! I am a bot. Type /help to see the list of commands');
    }
  }I
}

export default StartCommand;