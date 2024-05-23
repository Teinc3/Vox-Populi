import { SlashCommandBuilder, type CommandInteraction } from "discord.js";

const data = new SlashCommandBuilder().setName('parrot').setDescription('Tells you who you are.');

async function execute(interaction: CommandInteraction) {
    await interaction.reply(`Hello ${interaction.user.username}! You are a parrot! 🦜`);
}

export { data, execute }