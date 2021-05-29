const config = require('./../config.json'); // load bot config
const Discord = require('discord.js'); // Loads the discord API library

module.exports = {
  name: "onMessage",
  async event(message) {

    // end if there's no content
    if (!message.content) {
      return;
    }

    const client = message.client;

    // get cached roles of a user
    const roleCache = message.channel.type != "dm" && message.member && message.member.roles && message.member.roles.cache ? [...message.member.roles.cache.keys()] || [] : [];

    const botPing = ["<@" + client.user.id + ">","<@!" + client.user.id + ">"];

    const dmExtraPrefix = (message.channel.type == "dm") ? ["!","?","+","-"] : ["$"];
    // Find if message begins with a valid command prefix
    const prefix = config.prefix.concat(botPing).concat(dmExtraPrefix).filter(p => message.content.toLowerCase().startsWith(p));

    if (!prefix || prefix.length < 1) {
      return;
    }

    // Split commands and arguments from message so they can be passed to functions
    const args = message.content.slice(prefix[0].length).trim().split(/ +/);

    // the dashes and underscores are optional in command names, as is capitalisation
    const commandName = args.shift().toLowerCase().replace(/[-_]+/,'');

    // check if the message is a valid command
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    // return if command isn't valid
    if (!command) {
      return;
    }

    if (command.args && (!args.length || command.args > args.length)) {
      let reply = 'That command requires more details!';

      // If we have details on how to use the args, provide them
      if (command.usage) {
          reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
      }

      // Send a reply from the bot about any error encountered
      return message.channel.send(reply);
    }

    // manage cooldowns
    const cooldowns = message.client.cooldowns;

    if(!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3 ) * 1000;

    if(!timestamps.has(message.author.id)) {
      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    } else if (message.author.id != config.perms.dev) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if(now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`Whoa! You're sending commands too fast! Please wait ${timeLeft.toFixed(1)} more second(s) before running \`${command.name}\` again!`);
      }
      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    // manage perm denials
    if(command.perms) {

      //manage dev commands
      if (command.perms == "dev" && message.author.id != config.perms.dev) {
        return;
      }

      //manage dm commands
      if (message.channel.type == "dm") {
        if (!command.allowDM) {
          return message.reply("This command is not available for use in DMs.");
        }
        // manage non-dm command perms
      } else {
        // check perms for admin/mod commands where user isn't a dev
        if (message.author.id != config.perms.dev) {
          // only check further if user isn't an admin
          if (!roleCache.includes(config.perms.admin) || !message.member.hasPermission("ADMINISTRATOR")) {
            if (command.perms == "admin") {
              return message.reply("You do not have the required permissions to use this command; this command is only for server admins.");
              // only check further for non-mods (as mod is one down from admin)
            } else if (!roleCache.includes(config.perms.mod)) {
              if (command.perms == "op") {
                return message.reply("You do not have the required permissions to use this command; this command is only for server OPs (operators).");
              } else if (!roleCache.includes(config.perms.whitelist)) {
                if (command.perms == "whitelist") {
                  return message.reply("Sorry, this command is only available for users with a whitelisted minecraft account. If your account is whitelisted, let an admin know and we'll give you the discord role.");
                }
              }
            }
          }
        }
      }
    }

    // Try to run the command!
    try {
      await command.execute(message, args);
    } catch(error) {
      console.error(error);
      message.reply('Sorry! I ran into an error trying to do that!').then(m=>{
        m.delete({timeout:60*1000});
      });
      const devUser = client.users.cache.get(config.perms.dev);
      const msg = (message.content.length > 200) ? message.content.slice(0,200) + ' [...]' : message.content;
      const errmsg = (error.stack.toString().length > 1500) ? error.stack.toString().slice(0,1500) + '...' : error.stack;
      const errLocation = message.channel.type == "dm" ? 'in `Direct Messages`' : 'from `'+message.channel.name+'`';
      devUser.send('Error running command: `'+msg+'`\nSender: `'+message.author.username+'#'+message.author.discriminator+'` '+errLocation+'\nError Report:\n```'+errmsg+'```');
    }
  },
};
