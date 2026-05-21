const {
    SlashCommandBuilder,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addtracker")
        .setDescription("Créer un tracker TikTok")
        .addStringOption(option =>
            option.setName("username")
                .setDescription("Nom du compte TikTok")
                .setRequired(true)
        ),

    async execute(interaction) {

        const username = interaction.options.getString("username").replace("@", "");
        const userId = interaction.user.id;
        const guild = interaction.guild;

        // 🟢 LOAD DB SAFE
        let db = {};
        try {
            db = JSON.parse(fs.readFileSync("./database/trackers.json"));
        } catch {
            db = {};
        }

        // 🟢 CREATE PRIVATE CHANNEL
        const channel = await guild.channels.create({
            name: `stalker-${username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: userId,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },
                {
                    id: interaction.client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                }
            ]
        });

        // 🟢 SAVE DATABASE
        if (!db[userId]) {
            db[userId] = {
                channelId: channel.id,
                targets: {}
            };
        }

        db[userId].targets[username] = {
            posts: true,
            bio: true,
            followers: true,
            displayName: true,
            mention: []
        };

        fs.writeFileSync(
            "./database/trackers.json",
            JSON.stringify(db, null, 4)
        );

        // 🟢 EMBED DASHBOARD SIMPLE
        const embed = new EmbedBuilder()
            .setTitle("📊 Tracker activé")
            .setDescription(`Compte suivi : **@${username}**`)
            .addFields(
                { name: "📢 Posts", value: "ON", inline: true },
                { name: "📝 Bio", value: "ON", inline: true },
                { name: "👥 Followers", value: "ON", inline: true }
            )
            .setColor("Blue")
            .setFooter({ text: "Tracking actif toutes les 3 minutes" });

        await channel.send({ embeds: [embed] });

        return interaction.reply({
            content: `✅ Tracker créé : ${channel}`,
            ephemeral: true
        });
    }
};
