require('dotenv').config(); //for .env file

// Bot stuff below

// const Reddit = require('reddit'); // Reddit
const fetch = require('node-fetch'); // This lets me get stuff from api.
const Booru = require('booru'); // This lets me get stuff from weeb sites.
const fs = require('fs'); // Loads the Filesystem library
const path = require("path"); // Resolves file paths
const Discord = require('discord.js'); // Loads the discord API library
const Canvas = require('canvas'); // Pretty pictures
const readline = require('readline');
// const {google} = require('googleapis');

const {Client} = require('exaroton');

const config = require('./config.json'); // load bot config

// const mongoose = require("mongoose"); //database library
// const connectDB = require("./database/connectDB.js"); // Database connection
// const database = config.dbName; // Database name

const client = new Discord.Client({ws: { intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGE_TYPING', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_TYPING']}, partials: ['MESSAGE', 'CHANNEL', 'REACTION']}); // Initiates the client

client.commands = new Discord.Collection(); // Creates an empty list in the client object to store all commands

// function to find all js files in folder+subfolders
const getAllCommands = function (dir, cmds) {
  files = fs.readdirSync(dir, { withFileTypes: true });
  fileArray = cmds || [];
  files.forEach((file) => {
    if (file.isDirectory()) {
      const newCmds = fs.readdirSync(dir + '/' + file.name);
      fileArray = fileArray.concat(newCmds.map((f) => dir + '/' + file.name + '/' + f));
    } else if (file.name.endsWith('.js')) {
      fileArray = fileArray.concat([dir + '/' + file.name]);
    }
  });
  return fileArray;
};
const commandFiles = getAllCommands('./commands').filter(file => file.endsWith('.js')); // Loads the code for each command from the "commands" folder

// Loops over each file in the command folder and sets the commands to respond to their name
for (const file of commandFiles) {
    const command = require(file);
    client.commands.set(command.name, command);
}

client.cooldowns = new Discord.Collection(); // Creates an empty list for storing timeouts so people can't spam with commands

// load the core events into client
client.events = new Discord.Collection();
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    client.events.set(event.name, event);
}

async function mcTest(mcClient, logChannel) {
  let account = await mcClient.getAccount();
  console.log("My account is " + account.name + " and I have " + account.credits + " credits.");
  let servers = await mcClient.getServers();
  let status = "";
  let players = [];
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
      console.log("Subscribing to " + server.name + ". ID: " + server.id);
      server.subscribe();
      server.on("status", function(server) {
          const title = server.name;
          const footer = server.address;
          const statusArr = statJSON[""+server.status];
          if ("" + server.status != "" + status) {
            status = "" + server.status;
            const embed = new Discord.MessageEmbed()
            .setTitle(title + " - Status Update")
            .setFooter(footer)
            .setDescription(server.motd)
            .setColor(statusArr[2])
            .addField("Status",`${statusArr[0]} ${statusArr[1]}`,true)
            .addField("Players",`${server.players.count}/${server.players.max}`,true)
            .addField("Software",`${server.software.name} ${server.software.version}`,true)
            .setTimestamp();
            if (""+server.status != "1") {
              logChannel.send({embed: embed});
            } else {
              const statusPing = "<@&" + config.pings.status + ">";
              logChannel.send({embed: embed, content: statusPing});
            }
          }
          if (server.players.list) {
            // get players in the old list who aren't in the new one
            const leftPlayers = players.filter(p=>server.players.list.indexOf(p) === -1);
            // get players in the new list who weren't in the old one
            const joinedPlayers = server.players.list.filter(p=>players.indexOf(p) === -1);
            // server status text
            const statusArr = statJSON[""+server.status];

            for (let left of leftPlayers) {
              const embed = new Discord.MessageEmbed()
              .setTitle(title + " - Player Disconnected")
              .setFooter(footer)
              .setDescription(`${left} has logged off from ${server.name}!`)
              .setColor("#FF0000")
              .addField("Status",`${status[0]} ${status[1]}`,true)
              .addField("Players",`${server.players.count}/${server.players.max}`,true)
              .addField("Software",`${server.software.name} ${server.software.version}`,true)
              .setTimestamp();
              logChannel.send({embed: embed});
            }

            for (let joined of joinedPlayers) {
              const embed = new Discord.MessageEmbed()
              .setTitle(title + " - Player Connected")
              .setFooter(footer)
              .setDescription(`${joined} has logged on to ${server.name}!`)
              .setColor("#37d53f")
              .addField("Status",`${status[0]} ${status[1]}`,true)
              .addField("Players",`${server.players.count}/${server.players.max}`,true)
              .addField("Software",`${server.software.name} ${server.software.version}`,true)
              .setTimestamp();
              logChannel.send({embed: embed});
            }
          }
          if (server.players.list) {
            players = server.players.list;
          } else {
            players = [];
          }
          if (""+server.status == "1" && server.players.count == 0) {
            const embed = new Discord.MessageEmbed()
            .setTitle(title + " - Server Notice")
            .setFooter(footer)
            .setDescription("As there are currently no players online, the server may automatically go offline in just under 10 minutes.")
            .setColor("#37d53f")
            .addField("Status",`${status[0]} ${status[1]}`,true)
            .addField("Players",`${server.players.count}/${server.players.max}`,true)
            .addField("Software",`${server.software.name} ${server.software.version}`,true)
            .setTimestamp();
          }
      });
  }
}

// Starts the bot and makes it begin listening for commands.
client.on('ready', function() {
    client.user.setPresence({ status: 'online' }); // activity: { type: 'PLAYING', name: 'with Chaos' }
    console.log(`${client.user.username} is up and running! Launched at: ${(new Date()).toUTCString()}.`);

    const logChannel = client.guilds.resolve(config.guild).channels.resolve(config.channels.status);

    const mcClient = new Client(process.env.MCTOKEN);

    mcTest(mcClient, logChannel);
});

client.on('message', message => {
    if (!message || !message.author || message.author.bot) {
      return; // don't respond to bots
    }
    client.events.get("onMessage").event(message);
});

client.on('messageDelete', message => {
    if (!message.author || message.author.bot) {return} // don't respond to bots
    client.events.get("onDelete").event(message);
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (!newMessage.author || newMessage.author.bot) {return} // don't respond to bots
    client.events.get("onEdit").event(oldMessage, newMessage);
});

client.on('messageReactionAdd', (reaction, user) => {
    if (!user || user.bot) {return}
    client.events.get("onReactionAdd").event(reaction, user);
});

client.on('messageReactionRemove', (reaction, user) => {
    if (!user || user.bot) {return}
    client.events.get("onReactionRemove").event(reaction, user);
});

client.on('messageReactionRemoveEmoji', (reaction) => {
    client.events.get("onReactionTake").event(reaction); // when all reactions for a specific emoji are removed from a message (by a bot)
});

client.on('messageReactionRemoveAll', (message) => {
    client.events.get("onReactionClear").event(message);
});

// connectDB("mongodb://localhost:27017/"+database);

client.login(process.env.TOKEN); // Log the bot in using the token provided in the .env file
