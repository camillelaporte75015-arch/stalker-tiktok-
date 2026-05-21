const {
    SlashCommandBuilder,
    ChannelType,
    PermissionsBitField
} = require("discord.js");

const fs = require("fs");
const dashboard = require("../ui/dashboard");

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

        const username = interaction.options
            .getString("username")
            .replace("@", "")
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "")
            .slice(0, 20);

        const userId = interaction.user.id;
        const guild = interaction.guild;

        /* =========================
           LOAD DB
        ========================= */

        let db = {};

        try {
            db = JSON.parse(
                fs.readFileSync("./database/trackers.json")
            );
        } catch {
            db = {};
        }

        /* =========================
           CREATE CHANNEL
        ========================= */

        const channel = await guild.channels.create({
            name: `stalker-${username}-${Date.now()
                .toString()
                .slice(-4)}`,

            type: ChannelType.GuildText,

            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
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
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.ManageChannels
                    ]
                }
            ]
        });

        /* =========================
           SAVE DB
        ========================= */

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
            avatar: true,
            mention: []
        };

        fs.writeFileSync(
            "./database/trackers.json",
            JSON.stringify(db, null, 4)
        );

        /* =========================
           SEND V6 DASHBOARD
        ========================= */

        await channel.send(
            dashboard(
                username,
                db[userId].targets[username]
            )
        );

        /* =========================
           REPLY USER
        ========================= */

        return interaction.reply({
            content: `✅ Tracker créé : ${channel}`,
            ephemeral: true
        });
    }
};
