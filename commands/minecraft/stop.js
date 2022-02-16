const Discord = require('discord.js'); // Embed
const {Client} = require('exaroton');
require('dotenv').config(); //for .env file
const config = require('./../../config.json'); // load bot config

module.exports = {
    name: 'stop', // The name of the command
    description: 'Stops the server.', // The description of the command (for help text)
    allowDM: false,
    perms: "whitelist",
    args: false,
    cooldown: 10,
    group: 'minecraft',
    usage: '[server address]', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {
      const mcClient = new Client(process.env.MCTOKEN);
      let account = await mcClient.getAccount();
      let servers = await mcClient.getServers();
      servers = servers.filter(s=>config.mcServers.includes(s.name));
      const statJSON = {
        "0": ["🔴","Offline","#FF0000"],
        "1": ["🟢","Online","#37d53f"],
        "2": ["🟠","Starting","#fa7f26"],
        "3": ["🔴","Stopping","#FF0000"],
        "4": ["🟠","Restarting","#fa7f26"],
        "5": ["🔵","Saving","#2370dd"],
        "6": ["🟠","Loading","#fa7f26"],
        "7": ["🔴","Crashed","#FF0000"],
        "8": ["🟠","Pending","#fa7f26"],
        "9": ["","???","#000000"],
        "10": ["🟠","Preparing","#fa7f26"]
      };
      let server = "";
      if (servers.length == 1) {
        server = servers[0];
      } else if (args.length != 0) {
        const arg = args[0].toLowerCase().replace("rose","");
        server = servers.filter(s => s.address.toLowerCase().match(arg));
        if (server.length == 1) {
          server = server[0];
        } else {
          return message.reply("Invalid server name.");
        }
      } else {
        return message.reply("Unable to find a specific server to start. Try specifying a server more specifically, such as `$start city`, `$start RoseCity`, or `$start rosecity.exaroton.me`.");
      }
      const status = statJSON[""+server.status];
      if (server.status == 1) {
        if (server.players.count != 0) {
          return message.reply(`There are currently ${server.players.count}/${server.players.max} players online, so you don't have the permissions to manually stop the server early. If you're an admin, you can stop the server via the online dashboard.`)
        } else {
          try {
            await server.stop();
            return message.reply(`Attempting to stop \`${server.address}\`... See <#848274767034449990> for updates.`)
          } catch(e) {
            return message.reply("An error occured trying to stop the server.\n```\n"+e.stack+"\n```");
          }
        }
      } else {
        return message.reply(`Could not stop \`${server.address}\` as it is currently ${status[0]}${status[1]}.`);
      }
    },
};
