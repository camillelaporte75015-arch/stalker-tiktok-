const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("untrack")
        .setDescription("Supprimer un tracker")
        .addStringOption(option =>
            option.setName("username")
                .setDescription("Nom du compte TikTok")
                .setRequired(true)
        ),

    async execute(interaction) {

        const username = interaction.options.getString("username").replace("@", "");
        const userId = interaction.user.id;

        let db = {};
        try {
            db = JSON.parse(fs.readFileSync("./database/trackers.json"));
        } catch {
            db = {};
        }

        if (!db[userId] || !db[userId].targets[username]) {
            return interaction.reply({
                content: "❌ Tracker introuvable",
                ephemeral: true
            });
        }

        delete db[userId].targets[username];

        fs.writeFileSync("./database/trackers.json", JSON.stringify(db, null, 4));

        return interaction.reply({
            content: `🗑️ Tracker supprimé : @${username}`,
            ephemeral: true
        });
    }
};
