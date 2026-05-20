require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Collection,
    ActivityType
} = require("discord.js");

const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

/* =========================
   LOAD SLASH COMMANDS
========================= */

const commandFiles = fs
    .readdirSync("./commands")
    .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const cmd = require(`./commands/${file}`);
    client.commands.set(cmd.data.name, cmd);
}

/* =========================
   READY EVENT
========================= */

client.once("ready", () => {
    console.log(`${client.user.tag} connecté`);

    client.user.setActivity("TikTok Tracker", {
        type: ActivityType.Watching
    });

    // 🔥 START TRACKING ENGINE
    const stalkerEngine = require("./stalkerEngine");
    stalkerEngine(client);
});

/* =========================
   INTERACTIONS (slash + buttons)
========================= */

client.on("interactionCreate", async interaction => {

    /* ===== SLASH COMMANDS ===== */
    if (interaction.isChatInputCommand()) {

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (err) {
            console.error(err);
        }
    }

    /* ===== BUTTON SYSTEM ===== */
    if (interaction.isButton()) {

        const fs = require("fs");

        const trackers = JSON.parse(
            fs.readFileSync("./database/trackers.json")
        );

        const [type, username] =
            interaction.customId.split("_");

        if (!trackers[username]) {
            trackers[username] = {
                likes: false,
                followers: false,
                following: false,
                bio: false,
                avatar: false,
                posts: false,
                reposts: false,
                stories: false,
                mentions: []
            };
        }

        if (type === "mention") {

            if (!trackers[username].mentions.includes(interaction.user.id)) {
                trackers[username].mentions.push(interaction.user.id);
            }

        } else {
            trackers[username][type] =
                !trackers[username][type];
        }

        fs.writeFileSync(
            "./database/trackers.json",
            JSON.stringify(trackers, null, 4)
        );

        return interaction.reply({
            content: `Option **${type}** mise à jour pour @${username}`,
            ephemeral: true
        });
    }
});

/* =========================
   OWNER COMMANDS
========================= */

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (message.author.id !== process.env.OWNER_ID) return;

    if (message.content.startsWith("+play")) {

        const game = message.content.slice(6).trim();
        if (!game) return message.reply("Tu dois écrire un jeu.");

        client.user.setActivity(game, {
            type: ActivityType.Playing
        });

        return message.reply(`🎮 Joue à ${game}`);
    }

    if (message.content.startsWith("+say")) {

        const text = message.content.slice(5).trim();
        if (!text) return message.reply("Tu dois écrire un message.");

        await message.delete().catch(() => {});
        return message.channel.send(text);
    }
});

/* =========================
   LOGIN BOT
========================= */

client.login(process.env.TOKEN);
