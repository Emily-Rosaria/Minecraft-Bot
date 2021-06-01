const Discord = require('discord.js'); // Embed
const {Client} = require('exaroton');
require('dotenv').config(); //for .env file
const config = require('./../../config.json'); // load bot config

module.exports = {
    name: 'whitelist', // The name of the command
    description: 'Whitelists a minecraft account!', // The description of the command (for help text)
    aliases: ['credit','money','funds','bank','cost'],
    allowDM: true,
    cooldown: 10,
    usage: '[username]', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {

      if (!args || args.length == 0 || ![...message.member.roles.cache.keys()].has(role => [config.perms.op, config.perms.admin].includes(role)) || message.author.id != config.perms.dev || !message.member.hasPermission("ADMINISTRATOR")) {
        const mcClient = new Client(process.env.MCTOKEN);
        let account = await mcClient.getAccount();
        let servers = await mcClient.getServers();
        let server = servers.shift();
        const whitelist = await list.getEntries();
        await message.reply("The server whitelist should be:\n>>> "+whitelist.join('\n'));
        return;
      }


      if (!args[0].match(/^[a-zA-Z0-9_]{3,16}$/)) {
        return message.reply("`"+args[0]+"` is an invalid Minecraft username. Usernames must have 3-16 characters, and may only consist of the standard A-Z and 0-9 characters. Spaces aren't allowed and the only special character accepted is a `_` (underscore).");
      }

      const mcClient = new Client(process.env.MCTOKEN);
      let account = await mcClient.getAccount();
      let servers = await mcClient.getServers();
      let server = servers.shift();
      try {
          let list = server.getPlayerList("whitelist");
          await list.addEntry(args[0]); // add just one entry
          const whitelist = await list.getEntries();
          await message.reply("Done! The new server whitelist should be:\n>>> "+whitelist.join('\n'))
      } catch (e) {
          const errorMsg = e.stack.toString().length > 1900 ? e.stack.toString().slice(0,1900) + "..." : e.stack.toString();
          await message.reply("Error running command:\n```\n"+errorMsg+"\n```");
      }
    },
};
