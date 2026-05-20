const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stalker")
        .setDescription("Créer un tracker"),

    async execute(interaction) {
        await interaction.reply({
            content: "Tracker OK ✔️"
        });
    }
};
