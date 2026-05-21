const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync("./database/trackers.json"));
    } catch {
        return {};
    }
}

// 🧠 pagination state en mémoire
const pages = new Map();

function getPages(list, perPage = 5) {
    const result = [];
    for (let i = 0; i < list.length; i += perPage) {
        result.push(list.slice(i, i + perPage));
    }
    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tracklist")
        .setDescription("Dashboard V3 de tes trackers"),

    async execute(interaction) {

        const db = loadDB();
        const userId = interaction.user.id;

        const userData = db[userId];

        if (!userData || !userData.targets || Object.keys(userData.targets).length === 0) {
            return interaction.reply({
                content: "❌ Aucun tracker actif",
                ephemeral: true
            });
        }

        const list = Object.keys(userData.targets);
        const paginated = getPages(list, 5);

        pages.set(userId, {
            page: 0,
            data: paginated
        });

        const pageData = paginated[0];

        const embed = new EmbedBuilder()
            .setTitle("📋 Tracklist PRO V3")
            .setColor("Blue")
            .setDescription(`👥 Total trackers: ${list.length}\n📄 Page 1/${paginated.length}`);

        pageData.forEach((u, i) => {
            embed.addFields({
                name: `@${u}`,
                value: "📊 Clique pour ouvrir",
                inline: true
            });
        });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("track_prev")
                .setLabel("⬅️ Prev")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("track_next")
                .setLabel("➡️ Next")
                .setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            ...pageData.map(u =>
                new ButtonBuilder()
                    .setCustomId(`open_${u}`)
                    .setLabel(u.slice(0, 10))
                    .setStyle(ButtonStyle.Primary)
            )
        );

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        });
    }
};
