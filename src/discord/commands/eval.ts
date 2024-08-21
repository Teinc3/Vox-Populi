import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import settings from "../../data/settings.json" assert { type: "json" };

const data = new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Evaluates Code. Only the Bot Owner can use this command.')
    .setDMPermission(true)
    .addStringOption((option) => {
        option.setName('statement')
            .setDescription('The code you want to evaluate.')
            .setRequired(true);
        return option;
    })
    .addBooleanOption((option) => {
        option.setName('silent')
            .setDescription('Suppress the output? Default on.')
            .setRequired(false);
        return option;
    })

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const user = await interaction.client.users.fetch(interaction.user.id);
    const isOwner = user.id === settings.discord.botOwnerID;
    
    const statement = interaction.options.get('statement')!.value as string;
    const ephemeral = interaction.options.get('silent')?.value as boolean || true;
    if (!isOwner) {
        await interaction.followUp({ content: "You cannot use this command as you are not the Bot Owner.", ephemeral });
        return;
    }
    try {
        const result = await eval(`(async () => { ${statement} })();`);
        await interaction.followUp({ content: `Result: ${result}`, ephemeral });
    } catch (error) {
        await interaction.followUp({ content: `Error: ${error}`, ephemeral });
    }
}

export { data, execute }