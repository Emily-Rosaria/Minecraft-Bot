const Discord = require('discord.js'); // Embed
const {Client} = require('exaroton');
require('dotenv').config(); //for .env file

module.exports = {
    name: 'credits', // The name of the command
    description: 'Estimates the future server costs!', // The description of the command (for help text)
    aliases: ['credit','money','funds','bank','cost'],
    allowDM: true,
    cooldown: 10,
    usage: '', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {

      const mcClient = new Client(process.env.MCTOKEN);
      let account = await mcClient.getAccount();
      let servers = await mcClient.getServers();
      let server = servers.shift();
      let ram = await server.getRAM();
      const hours = Math.floor(account.credits / ram);
      const days = Math.floor(hours / 4);
      const color = hours > 20 ? "#37d53f" : (hours > 10 ? "#fa7f26" : "#ff0000");
      const embed = new Discord.MessageEmbed()
      .setTitle("The Server Bank")
      .setDescription(`Hosting costs about 1 credit / 1 GB RAM / 1 hour. Currently, we should have about ${hours} of uptime left. This will likely equate to at least ${days}, assuming the server is up 4 hours per day.`)
      .setColor(color)
      .addField("Credits",`${account.credits}`,true)
      .addField("RAM",`${ram} GB`,true)
      .addField("Hourly Cost",`${ram} credits / hour`,true)
      .addField("Credits to £UK",`£0.88 ≈ 100 credits`,true)
      .addField("Credits to $US",`$1.22 ≈ 100 credits`,true)
      .addField("Credits to €EU",`€1.00 = 100 credits`,true)
      .setFooter("exaroton.com")
      .setTimestamp();
      await message.channel.send({embed: embed});
      }
    },
};
