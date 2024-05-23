import { SlashCommandBuilder, type CommandInteraction } from "discord.js";

const data = new SlashCommandBuilder().setName('config').setDescription("Updates the Server's Political Configuration.");

async function execute(interaction: CommandInteraction) {
    await interaction.reply('This feature is not yet implemented.');
}

export { data, execute }