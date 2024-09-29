export const checkCommand = (ctx) => {
  let command = '';
  if (ctx.update.callback_query) {
    command =  ctx.update.callback_query.data;
  } else if (ctx.message) {
    command = ctx.message.text;
  }
  return command.split('@')[0];
}

export const checkUsername = (ctx) => {
  if (ctx.update.callback_query) {
    return ctx.update.callback_query.from.username;
  } else if (ctx.message) {
    return ctx.message.from.username;
  }
}

