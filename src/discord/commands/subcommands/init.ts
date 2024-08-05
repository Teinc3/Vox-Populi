import { ChatInputCommandInteraction } from 'discord.js';
import { createGuildDocument } from '../../../db/schema/Guild.js';

import { PoliticalSystemsType } from '../../../types/static.js';

export default async function init(interaction: ChatInputCommandInteraction): Promise<boolean> {
    interaction.deferReply({ ephemeral: true });
    // Read Political System
    const politicalSystemChoice = (interaction.options.get('politicalsystem')?.value as string)!; // Asserted, since option is required
    let politicalSystem: PoliticalSystemsType;
    if (politicalSystemChoice === 'presidential') {
        politicalSystem = PoliticalSystemsType.Presidential;
    } else if (politicalSystemChoice === 'parliamentary') {
        politicalSystem = PoliticalSystemsType.Parliamentary;
    } else if (politicalSystemChoice === 'directdemocracy') {
        politicalSystem = PoliticalSystemsType.DirectDemocracy;
    } else {
        return false
    }

    // Update database with new guild object
    const result = await createGuildDocument(interaction, politicalSystem, "Server Initialization");
    
    if (result) {
        await interaction.followUp({ content: `Server has been successfully configured.`, ephemeral: false });
    }
    return result
}