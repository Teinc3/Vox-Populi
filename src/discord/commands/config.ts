import { SlashCommandBuilder, type CommandInteraction } from "discord.js";

import type DBManager from "../../db/DBManager.js";

const data = new SlashCommandBuilder();
data.setName('config');
data.setDescription("Configures the Server.");

data.addStringOption((option) => {
    option.setName('system');
    option.setDescription('Select the desired political system.');
    option.setRequired(true);
    option.addChoices(
        { name: 'Presidential', value: 'presidential' },
        { name: 'Parliamentary', value: 'parliamentary' }
    );
    return option;
});

data.addStringOption((option) => {
    option.setName('prefix');
    option.setDescription('Set the prefix for the bot. Defaults to >');
    option.setRequired(false);
    return option;
});

/* data.addStringOption((option) => {
    option.setName('voting_channel');
    option.setDescription('Name of the voting chamber');
    option.setRequired(true);
    return option;
}); */

async function execute(interaction: CommandInteraction, dbManager: DBManager) {
    const guild = interaction.guild;
    if (!guild || guild.id === '') {
        return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
    }

    const system = interaction.options.get('system')?.value as string || '';
    const prefix = interaction.options.get('prefix')?.value as string || '>';

    if (system !== 'presidential' && system !== 'parliamentary') {
        return interaction.reply({ content: 'Invalid political system.', ephemeral: true });
    }
 
    //const votingChannelName = interaction.options.get('voting_channel')?.value as string || '';

    if (!system/*  || !votingChannelName */) {
        return interaction.reply({ content: 'Missing required options.', ephemeral: true });
    }

    await interaction.reply({ content: 'Configuring the server...', ephemeral: true });
    try {
        // Create a new message channel with the name provided by the user
        /* const channel = await guild.channels.create({ name: votingChannelName as string });
        if (!channel) {
            // Throw an error to be caught by the catch block
            throw new Error();
        } */

        const result = dbManager.createGuildDocument(guild.id, prefix, system);
        if (!result) {
            throw new Error();
        }
        interaction.editReply({ content: 'Server has been configured successfully.' });

    } catch (error) {
        return interaction.editReply({ content: 'There was an error while configuring the server.'});
    }
}

export { data, execute }