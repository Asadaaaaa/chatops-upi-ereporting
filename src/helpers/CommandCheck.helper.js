export const checkCommand = (ctx) => {
  let command = '';
  if (ctx.update.callback_query) {
    command =  ctx.update.callback_query.data;
  }
  if (ctx.message) {
    if (ctx.message.document) return null;
    command = ctx.message.text;
  }
  return command.split('@')[0];
}

export const checkUsername = (ctx) => {
  if (ctx.update.callback_query) {
    return ctx.update.callback_query.from.username;
  } else if (ctx.message && ctx.message.from.username) {
    return ctx.message.from.username;
  }
  return null;
}

