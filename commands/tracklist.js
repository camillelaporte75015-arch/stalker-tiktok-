const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tracklist")
        .setDescription("Voir tes trackers"),

    async execute(interaction) {

        let db = {};
        try {
            db = JSON.parse(fs.readFileSync("./database/trackers.json"));
        } catch {
            db = {};
        }

        const userId = interaction.user.id;
        const data = db[userId];

        if (!data || !data.targets) {
            return interaction.reply({
                content: "❌ Aucun tracker trouvé",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("📋 Tes trackers")
            .setColor("Green");

        for (const [username, t] of Object.entries(data.targets)) {
            embed.addFields({
                name: `@${username}`,
                value:
                    `📢 Posts: ${t.posts ? "ON" : "OFF"}\n` +
                    `📝 Bio: ${t.bio ? "ON" : "OFF"}\n` +
                    `👥 Followers: ${t.followers ? "ON" : "OFF"}`
            });
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
