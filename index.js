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

    // 🟢 ENGINE V4
    try {
        const stalkerEngine = require("./stalkerEngine");
        if (stalkerEngine) stalkerEngine(client);
    } catch (err) {
        console.error("Engine error:", err);
    }
});

/* =========================
   INTERACTIONS
========================= */

client.on("interactionCreate", async interaction => {

    /* ===== SLASH COMMANDS ===== */
    if (interaction.isChatInputCommand()) {

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (err) {
            console.error("Command error:", err);
        }
    }

    /* =========================
       BUTTON SYSTEM V2 CLEAN
    ========================= */

    if (interaction.isButton()) {

        const fs = require("fs");

        let db = {};
        try {
            db = JSON.parse(fs.readFileSync("./database/trackers.json"));
        } catch {
            db = {};
        }

        const [type, ...rest] = interaction.customId.split("_");
        const username = rest.join("_");

        // 🔍 find owner
        const ownerId = Object.keys(db).find(uid =>
            db[uid]?.targets?.[username]
        );

        if (!ownerId) {
            return interaction.reply({
                content: "❌ Tracker introuvable",
                ephemeral: true
            });
        }

        const target = db[ownerId].targets[username];

        if (!target) {
            return interaction.reply({
                content: "❌ Target introuvable",
                ephemeral: true
            });
        }

        // 🧠 SAFE INIT
        if (!Array.isArray(target.mention)) {
            target.mention = [];
        }

        /* =========================
           ACTIONS SPECIALES
        ========================= */

        // 🗑️ UNTRACK
        if (type === "untrack") {

            delete db[ownerId].targets[username];

            // delete user if empty
            if (Object.keys(db[ownerId].targets).length === 0) {
                delete db[ownerId];
            }

            fs.writeFileSync("./database/trackers.json", JSON.stringify(db, null, 4));

            return interaction.reply({
                content: `🗑️ Tracker supprimé @${username}`,
                ephemeral: true
            });
        }

        // 🔄 REFRESH
        if (type === "refresh") {
            return interaction.reply({
                content: `🔄 Refresh demandé pour @${username}`,
                ephemeral: true
            });
        }

        // 📜 HISTORY
        if (type === "history") {
            return interaction.reply({
                content: `📜 History bientôt dispo`,
                ephemeral: true
            });
        }

        /* =========================
           TOGGLE NORMAL OPTIONS
        ========================= */

        if (type === "mention") {

            if (target.mention.includes(interaction.user.id)) {
                target.mention = target.mention.filter(u => u !== interaction.user.id);
            } else {
                target.mention.push(interaction.user.id);
            }

        } else {
            target[type] = !target[type];
        }

        fs.writeFileSync("./database/trackers.json", JSON.stringify(db, null, 4));

        return interaction.reply({
            content: `✅ ${type} mis à jour pour @${username}`,
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
   LOGIN
========================= */

client.login(process.env.TOKEN);
