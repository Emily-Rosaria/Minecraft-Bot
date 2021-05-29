/**
 * This class responds to anyone that types !bot talk and chooses one of the phrases below to respond with at random.
 *
 */
module.exports = {
    name: 'talk', // The name of the command
    description: 'Make the bot say random predetermined phrases (this is mostly a test function).', // The description of the command (for help text)
    args: false, // Specified that this command doesn't need any data other than the command
    allowDM: true,
    usage: '', // Help text to explain how to use the command (if it had any arguments)
    execute(message, args) {

        // List of phrases to respond with
        var phrases = [
            'Hello, World.',
            'The Quick Brown Fox Jumps Over The Lazy Dog',
            'I am the very model of a modern major general.',
            'The mitochondria is the powerhouse of the cell.'
        ];

        message.reply(phrases[Math.floor(Math.random()*phrases.length)]); // Replies to the user with a random phrase
    },
};
