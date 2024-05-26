import { SlashCommandBuilder, type CommandInteraction } from "discord.js";

import type DBManager from "../../db/DBManager.js";

import { PoliticalSystemsType } from "../../types/static.js";

const data = new SlashCommandBuilder();
data.setName('config');
data.setDescription("Configures the Server.");

data.addStringOption((option) => {
    option.setName('system');
    option.setDescription('Select the desired political system for the server.');
    option.setRequired(true);
    option.addChoices(
        { name: 'Presidential', value: 'presidential' },
        { name: 'Parliamentary', value: 'parliamentary' },
        { name: 'Direct Democracy', value: 'directdemocracy'}
    );
    return option;
});

data.addBooleanOption((option) => {
    option.setName('config_admin');
    option.setDescription('Give you admin permissions to configure the server.');
    option.setRequired(false);
    return option;
});

async function execute(interaction: CommandInteraction, dbManager: DBManager) {
    let { guild } = interaction;
    if (guild === null) {
        return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
    }

    guild = await guild.fetch();

    const system = interaction.options.get('system')?.value as string || '';

    let politicalSystemType: PoliticalSystemsType;
    switch (system) {
        case 'presidential':
            politicalSystemType = PoliticalSystemsType.Presidential;
            break;
        case 'parliamentary':
            politicalSystemType = PoliticalSystemsType.Parliamentary;
            break;
        case 'directdemocracy':
            politicalSystemType = PoliticalSystemsType.DirectDemocracy;
            break;
        default:
            return interaction.reply({ content: 'Invalid political system.', ephemeral: true });
    }
 
    try {
        const isBotOwner = guild.ownerId === interaction.client.user.id;

        const result = await dbManager.createGuildDocument(guild.id, politicalSystemType, isBotOwner);
        if (!result) {
            throw new Error();
        } else {
            interaction.reply({ content: 'Server has been configured successfully.' , ephemeral: true });
        }

    } catch (error) {
        return interaction.reply({ content: 'There was an error while configuring the server.', ephemeral: true});
    }
}

export { data, execute }