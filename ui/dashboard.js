const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = (username, settings) => {

    const embed = new EmbedBuilder()
        .setTitle(`📊 Dashboard @${username}`)
        .setColor("Blue")
        .setDescription("Configuration du tracker TikTok")
        .addFields(
            {
                name: "📝 Bio",
                value: settings.bio ? "🟢 ON" : "🔴 OFF",
                inline: true
            },
            {
                name: "🪪 Pseudo",
                value: settings.displayName ? "🟢 ON" : "🔴 OFF",
                inline: true
            },
            {
                name: "👥 Followers",
                value: settings.followers ? "🟢 ON" : "🔴 OFF",
                inline: true
            },
            {
                name: "🖼️ Avatar",
                value: settings.avatar ? "🟢 ON" : "🔴 OFF",
                inline: true
            },
            {
                name: "📢 Posts",
                value: settings.posts ? "🟢 ON" : "🔴 OFF",
                inline: true
            },
            {
                name: "👤 Mention",
                value: settings.mention?.length > 0
                    ? `🟢 ${settings.mention.length}`
                    : "🔴 OFF",
                inline: true
            }
        )
        .setFooter({
            text: "V6 Dashboard System"
        });

    /* =========================
       ROW 1
    ========================= */

    const row1 = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
            .setCustomId(`bio_${username}`)
            .setLabel("Bio")
            .setStyle(
                settings.bio
                    ? ButtonStyle.Success
                    : ButtonStyle.Secondary
            ),

        new ButtonBuilder()
            .setCustomId(`displayName_${username}`)
            .setLabel("Pseudo")
            .setStyle(
                settings.displayName
                    ? ButtonStyle.Success
                    : ButtonStyle.Secondary
            ),

        new ButtonBuilder()
            .setCustomId(`followers_${username}`)
            .setLabel("Followers")
            .setStyle(
                settings.followers
                    ? ButtonStyle.Success
                    : ButtonStyle.Secondary
            ),

        new ButtonBuilder()
            .setCustomId(`avatar_${username}`)
            .setLabel("Avatar")
            .setStyle(
                settings.avatar
                    ? ButtonStyle.Success
                    : ButtonStyle.Secondary
            )
    );

    /* =========================
       ROW 2
    ========================= */

    const row2 = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
            .setCustomId(`posts_${username}`)
            .setLabel("Posts")
            .setStyle(
                settings.posts
                    ? ButtonStyle.Success
                    : ButtonStyle.Secondary
            ),

        new ButtonBuilder()
            .setCustomId(`mention_${username}`)
            .setLabel("Mention")
            .setStyle(
                settings.mention?.length > 0
                    ? ButtonStyle.Primary
                    : ButtonStyle.Secondary
            ),

        new ButtonBuilder()
            .setCustomId(`refresh_${username}`)
            .setLabel("Refresh")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(`history_${username}`)
            .setLabel("History")
            .setStyle(ButtonStyle.Secondary)
    );

    /* =========================
       ROW 3
    ========================= */

    const row3 = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
            .setCustomId(`untrack_${username}`)
            .setLabel("🗑️ Untrack")
            .setStyle(ButtonStyle.Danger)
    );

    return {
        embeds: [embed],
        components: [row1, row2, row3]
    };
};
