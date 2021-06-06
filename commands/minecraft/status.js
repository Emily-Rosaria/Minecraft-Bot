const Discord = require('discord.js'); // Embed
const {Client} = require('exaroton');
require('dotenv').config(); //for .env file

module.exports = {
    name: 'status', // The name of the command
    description: 'Shows you the server status!', // The description of the command (for help text)
    aliases: ['server'],
    allowDM: true,
    cooldown: 10,
    usage: '', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {

      const mcClient = new Client(process.env.MCTOKEN);
      let account = await mcClient.getAccount();
      let servers = await mcClient.getServers();
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
      for (let server of servers) {
        const title = server.name;
        const footer = server.address;
        const status = statJSON[""+server.status];
        const embed = new Discord.MessageEmbed()
        .setTitle(title + " - Server Status")
        .setFooter(footer)
        .setDescription(server.motd)
        .setColor(status[2])
        .addField("Status",`${status[0]} ${status[1]}`,true)
        .addField("Players",`${server.players.count}/${server.players.max}`,true)
        .addField("Software",`${server.software.name} ${server.software.version}`,true)
        .setTimestamp();
        if (server.port && server.host) {
          embed.addField("Trouble Joining",`Try using the following dynamic IP instead: \`${server.host}:${server.port}\``,false);
        }
        if (server.players.count > 0) {
          const playerList = server.players.list.join(', ');
          embed.addField("Currently Online",playerList,false);
        }
        await message.channel.send({embed: embed});
      }
    },
};
