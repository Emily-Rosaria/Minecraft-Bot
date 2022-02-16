const config = require('./../../config.json'); // load bot config

/**
 * Runs the help command, explaining each available command to the user.
 */
module.exports = {
    name: 'github',
    description: 'Posts a link to the github repository.',
    aliases: ['git'],
    perms: false, //no user-based restrictions
    allowDM: true,
    group: 'util',
    async execute(message, args) {
        message.reply("My spaghetti source code can be found here:\n> "+config.github);
    },
};
