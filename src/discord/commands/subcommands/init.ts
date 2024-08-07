import { ChatInputCommandInteraction } from 'discord.js';
import { isDocument } from '@typegoose/typegoose';

import { createGuildDocument } from '../../../schema/Guild.js';
import { PoliticalRoleModel } from '../../../schema/roles/PoliticalRole.js';

import { PoliticalSystemsType } from '../../../types/types.js';

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
    
    if (!result) {
        await interaction.followUp({ content: `Server has already been configured.`, ephemeral: true });
        return false;
    }
    await interaction.followUp({ content: `Server has been successfully configured.`, ephemeral: false });

    // Assign the bot the Vox Populi role
    await result.populate({ path: 'roles', select: 'VoxPopuli' });
    if (!isDocument(result.roles)) {
        return true;
    }

    await result.populate({ path: 'roles.VoxPopuli', model: PoliticalRoleModel, select: 'roleID' });
    if (!isDocument(result.roles.VoxPopuli)) {
        return true;
    }

    const roleID = result.roles.VoxPopuli.roleID;
    if (!roleID) {
        return true;
    }
    const guild = interaction.guild!;
    const role = await guild.roles.fetch(roleID);
    if (role) {
        // Assign the role to the bot
        await guild.members.me?.roles.add(role);
    }

    return true;
}