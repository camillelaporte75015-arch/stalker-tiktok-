const {
    SlashCommandBuilder,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
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

        const username = interaction.options.getString("username")
            .replace("@", "")
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "")
            .slice(0, 20);

        const userId = interaction.user.id;
        const guild = interaction.guild;

        // 🟢 LOAD DB SAFE
        let db = {};
        try {
            db = JSON.parse(fs.readFileSync("./database/trackers.json"));
        } catch {
            db = {};
        }

        // 🟢 SAFE CHANNEL CREATION (FIX 50013 + collision)
        const channel = await guild.channels.create({
            name: `stalker-${username}-${Date.now().toString().slice(-4)}`,
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
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.ManageChannels
                    ]
                }
            ]
        });

        // 🟢 SAVE DATABASE (CLEAN STRUCTURE)
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

        // 🟢 EMBED DASHBOARD
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

        // 🟢 BUTTONS (IMPORTANT POUR TON SYSTEME)
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`posts_${username}`)
                .setLabel("Posts")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`bio_${username}`)
                .setLabel("Bio")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`followers_${username}`)
                .setLabel("Followers")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`displayName_${username}`)
                .setLabel("Pseudo")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(`mention_${username}`)
                .setLabel("Mention")
                .setStyle(ButtonStyle.Success)
        );

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        return interaction.reply({
            content: `✅ Tracker créé : ${channel}`,
            ephemeral: true
        });
    }
};
