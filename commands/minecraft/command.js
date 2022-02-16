const Discord = require('discord.js'); // Embed
const {Client} = require('exaroton');
require('dotenv').config(); //for .env file
const config = require('./../../config.json'); // load bot config

module.exports = {
    name: 'command', // The name of the command
    description: 'Executes a server command.', // The description of the command (for help text)
    allowDM: true,
    perms: "dev",
    args: true,
    cooldown: 10,
    group: 'minecraft',
    usage: '<command>', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {
      return message.reply("Command is WIP. Sorry.");
      /*
      const statJSON = {
        "0": ["🔴","Offline","#FF0000","Offline"],
        "1": ["🟢","Online","#37d53f","Online"],
        "2": ["🟠","Starting","#fa7f26","Starting"],
        "3": ["🔴","Stopping","#FF0000","Offline"],
        "4": ["🟠","Restarting","#fa7f26","Starting"],
        "5": ["🔵","Saving","#2370dd","Offline"],
        "6": ["🟠","Loading","#fa7f26","Starting"],
        "7": ["🔴","Crashed","#FF0000","Crashed"],
        "8": ["🟠","Pending","#fa7f26","Pending"],
        "9": ["","???","#000000","Pending"],
        "10": ["🟠","Preparing","#fa7f26","Starting"]
      };

      const command = args.join(' ');
      const mcClient = new Client(process.env.MCTOKEN);
      let account = await mcClient.getAccount();
      let servers = await mcClient.getServers();
      let server = servers.shift();
      if (!server.hasStatus(server.STATUS.ONLINE)) {
        return message.reply("The server is currently "+ statJSON[""+server.status][1].toLowerCase() +", so commands cannot be sent.");
      }
      try {
          await server.executeCommand("command={"+command+"}");
          await message.reply("Done! Command `" + command + "` was sent to the server successfully.");
      } catch (e) {
          const errorMsg = e.stack.toString().length > 1900 ? e.stack.toString().slice(0,1900) + "..." : e.stack.toString();
          await message.reply("Error sending command of `"+command+"`:\n```\n"+e.message+"\n"+errorMsg+"\n```");
      }
      */
    },
};
