const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior
} = require('@discordjs/voice');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN; // Bot token
const CHANNEL_ID = process.env.CHANNEL_ID; // Voice channel ID
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN);
console.log('CHANNEL_ID:', process.env.CHANNEL_ID);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    scheduleHourlyChime();
});

function scheduleHourlyChime() {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours()+1, 0, 0, 0); // Set to the start of the next hour
    const timeUntilNextHour = nextHour - now;

    console.log(`Next chime scheduled in ${Math.floor(timeUntilNextHour / 1000)} seconds.`);

    // Set timeout to wait until the next hour, then start the hourly interval
    let chiming = setInterval(function(){
        playChime();
    }, timeUntilNextHour);
    chiming
    //setTimeout(clearInterval, 3600000, chiming);

/*    setTimeout(() => {
          playChime();
          setInterval(playChime, 3600000); // Repeat every hour
    }, timeUntilNextHour);
*/
}

async function playChime() {
    console.log('Attempting to play chime...');
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
        console.error('Voice channel not found or invalid.');
        return;
    }

    const connection = joinVoiceChannel({
        channelId: CHANNEL_ID,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
        },
    });

    connection.subscribe(player);

    // Determine the current hour in 12-hour format
    let hour = new Date().getHours() % 12;
    if (hour === 0) hour = 12; // Adjust for midnight and noon
    console.log(`Playing ${hour} chime(s) for the hour.`);

    // Path to your local MP3 file
    const chimePath = path.join(__dirname, 'bigben.mp3');

    // Play the chime sound 'hour' times
    for (let i = 0; i < hour; i++) {
        const resource = createAudioResource(chimePath);
        player.play(resource);

        // Wait for the current chime to finish before playing the next
        await new Promise((resolve) => {
            player.once(AudioPlayerStatus.Idle, resolve);
        });

        console.log(`Chime ${i + 1} of ${hour} played.`);
    }

    console.log('Finished all chimes for the hour. Disconnecting...');
    player.stop();
    connection.destroy();
}

client.login(TOKEN);
