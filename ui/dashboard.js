const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

function buildButtons(id) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`mute_${id}`)
            .setLabel("🔕 Mute")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`untrack_${id}`)
            .setLabel("🗑 Untrack")
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId(`history_${id}`)
            .setLabel("📜 History")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(`refresh_${id}`)
            .setLabel("🔄 Refresh")
            .setStyle(ButtonStyle.Success)
    );
}

async function buildDashboard(id, changes) {

    const embed = new EmbedBuilder()
        .setTitle(`🟢 UPDATE @${id}`)
        .setDescription(`📊 ${changes.length} changement(s) détecté(s)\n\n` + changes.join("\n\n"))
        .setColor("Green")
        .setTimestamp();

    return {
        embeds: [embed],
        components: [buildButtons(id)]
    };
}

module.exports = { buildDashboard };
