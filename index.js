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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

/* =========================
   LOAD COMMANDS
========================= */
const commandFiles = fs
    .readdirSync("./commands")
    .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const cmd = require(`./commands/${file}`);
    client.commands.set(cmd.data.name, cmd);
}

/* =========================
   READY
========================= */
client.once("ready", () => {
    console.log(`${client.user.tag} connecté`);

    client.user.setActivity("TikTok Tracker", {
        type: ActivityType.Watching
    });

    /* =========================
       SAFE ENGINE INIT (ANTI DUPLICATE)
    ========================= */
    try {
        if (!client.__engine_loaded__) {
            const engine = require("./stalkerEngine");
            engine(client);
            client.__engine_loaded__ = true;

            console.log("🟢 Engine chargé avec succès");
        } else {
            console.log("⚠️ Engine déjà chargé, skip");
        }
    } catch (err) {
        console.error("Engine error:", err);
    }
});

/* =========================
   GLOBAL ERROR HANDLING
========================= */
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

/* =========================
   INTERACTIONS
========================= */
client.on("interactionCreate", async interaction => {

    if (interaction.isChatInputCommand()) {

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (err) {
            console.error("Command error:", err);
        }
        return;
    }

    if (!interaction.isButton()) return;

    let db = {};
    try {
        db = JSON.parse(fs.readFileSync("./database/trackers.json"));
    } catch {
        db = {};
    }

    const [type, ...rest] = interaction.customId.split("_");
    const id = rest.join("_");

    const ownerId = Object.keys(db).find(uid =>
        db[uid]?.targets?.[id]
    );

    if (!ownerId) {
        return interaction.reply({
            content: "❌ Tracker introuvable",
            ephemeral: true
        });
    }

    const target = db[ownerId].targets[id];

    if (!target) {
        return interaction.reply({
            content: "❌ Target introuvable",
            ephemeral: true
        });
    }

    if (!Array.isArray(target.mention)) {
        target.mention = [];
    }

    switch (type) {

        case "untrack":
            delete db[ownerId].targets[id];

            if (Object.keys(db[ownerId].targets).length === 0) {
                delete db[ownerId];
            }

            fs.writeFileSync("./database/trackers.json", JSON.stringify(db, null, 4));

            return interaction.reply({
                content: `🗑 Tracker supprimé @${id}`,
                ephemeral: true
            });

        case "mention":
            if (target.mention.includes(interaction.user.id)) {
                target.mention = target.mention.filter(u => u !== interaction.user.id);
            } else {
                target.mention.push(interaction.user.id);
            }
            break;

        default:
            target[type] = !target[type];
            break;
    }

    fs.writeFileSync("./database/trackers.json", JSON.stringify(db, null, 4));

    return interaction.reply({
        content: `✅ ${type} mis à jour pour @${id}`,
        ephemeral: true
    });
});

/* =========================
   LOGIN
========================= */
client.login(process.env.TOKEN);
