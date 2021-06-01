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

async function setBotStatus(server, client, oldStats) {
  var botStatus = {};
  const statusArr = statJSON[""+server.status];
  if (""+ server.status == "1") {
    botStatus.status = "online";
    botStatus.activity = { type: 'PLAYING', name: `${statusArr[0]} ${server.players.count}/${server.players.max} online` };
  } else if (["2","4","6","8","10"].includes(""+ server.status)) {
    botStatus.status = "idle";
    botStatus.activity = { type: 'PLAYING', name: `${statusArr[0]} ${statusArr[1]}` };
  } else {
    botStatus.status = "dnd";
    botStatus.activity = { type: 'PLAYING', name: `${statusArr[0]} ${statusArr[1]}` };
  }
  client.user.setPresence(botStatus);

  var newStats = ""+server.status;
  var statRole = client.guilds.resolve(config.guild).roles.resolve(config.roles.status);

  if (!oldStats) {
    const newText = statJSON[newStats][3];
    await statRole.setName(`Server Status: ${newText}`);
    const color = newStats == "5" ? statJSON["0"][2] : statJSON[newStats][2];
    await statRole.setColor(color);
  } else {
    const oldText = statJSON[oldStats][3];
    const newText = statJSON[newStats][3];
    if (oldText != newText) {
      await statRole.setName(`Server Status: ${newText}`);
      const color = newStats == "5" ? statJSON["0"][2] : statJSON[newStats][2];
      await statRole.setColor(color);
    }
  }
}

async function mcTest(mcClient, logChannel) {
  let account = await mcClient.getAccount();
  console.log("My account is " + account.name + " and I have " + account.credits + " credits.");
  let servers = await mcClient.getServers();
  let status = "";
  let players = [];

  for (let server of servers) {
      console.log("Subscribing to " + server.name + ". ID: " + server.id);
      setBotStatus(server, logChannel.client);
      status = ""+server.status;
      players = server.players.list || [];
      server.subscribe();
      server.on("status", function(server) {
          setBotStatus(server, logChannel.client, status);
          const title = server.name;
          const footer = server.address;
          const statusArr = statJSON[""+server.status];

          // do updates for server status
          if ("" + server.status != "" + status) {
            status = "" + server.status;
            const embed = new Discord.MessageEmbed()
            .setTitle(title + " - Status Update")
            .setFooter(footer)
            .setColor(statusArr[2])
            .addField("Status",`${statusArr[0]} ${statusArr[1]}`,true)
            .addField("Players",`${server.players.count}/${server.players.max}`,true)
            .addField("Software",`${server.software.name} ${server.software.version}`,true)
            .setTimestamp();
            if (""+server.status != "1") {
              if (["0"].includes(""+server.status)) {
                embed.setDescription(`**${server.name}** is now ${statusArr[1]}.`);
              } else if (["7"].includes(""+server.status)) {
                embed.setDescription(`**${server.name}** has ${statusArr[1]}!`);
              } else {
                embed.setDescription(`**${server.name}** is ${statusArr[1]}...`);
              }
              logChannel.send({embed: embed});
            } else {
              embed.setDescription(`**${server.name}** is now ${statusArr[1]}!`);
              const statusPing = "<@&" + config.pings.status + ">";
              logChannel.send({embed: embed, content: statusPing});
            }
          } else {
            status = "" + server.status;
          }

          // do posts for players joining/leaving
          if (server.players.list || players.length > 0) {
            const serverlist = server.players.list || [];
            // get players in the old list who aren't in the new one
            const leftPlayers = players.filter(p=>serverlist.indexOf(p) === -1);
            // get players in the new list who weren't in the old one
            const joinedPlayers = serverlist.filter(p=>players.indexOf(p) === -1);
            // server status text
            const statusArr = statJSON[""+server.status];

            // post for players who left
            for (let left of leftPlayers) {
              const embed = new Discord.MessageEmbed()
              .setFooter(footer)
              .setDescription(`**${left}** has logged off from ${server.name}!`)
              .setColor("#FF0000")
              .setTimestamp();
              logChannel.send({embed: embed});
            }

            // post for players who joined
            for (let joined of joinedPlayers) {
              const embed = new Discord.MessageEmbed()
              .setFooter(footer)
              .setDescription(`**${joined}** has logged on to ${server.name}!`)
              .setColor("#37d53f")
              .setTimestamp();
              logChannel.send({embed: embed});
            }

            players = serverlist;

            // if the last player left, let people know the server may shut down soon
            if (""+server.status == "1" && (server.players.count == 0 || players.length == 0) && leftPlayers.length > 0) {
              const embed = new Discord.MessageEmbed()
              .setTitle(title + " - Server Notice")
              .setFooter(footer)
              .setDescription("As there are currently no players online, the server may automatically go offline in just under 10 minutes.")
              .setColor("#37d53f")
              .addField("Status",`${statusArr[0]} ${statusArr[1]}`,true)
              .addField("Players",`${server.players.count}/${server.players.max}`,true)
              .addField("Software",`${server.software.name} ${server.software.version}`,true)
              .setTimestamp();
              logChannel.send({embed: embed});
            }
          } else {
            players = [];
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
