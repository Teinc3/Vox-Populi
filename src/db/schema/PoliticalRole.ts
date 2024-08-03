import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import type { Guild, ChatInputCommandInteraction } from 'discord.js';

import { PoliticalSystemsType } from '../../types/static.js';
import PoliticalRoleHolder from './PoliticalRolesHolder.js';

class PoliticalRole {
    @prop({ required: true })
    name!: string;
    
    @prop({ required: true })
    hierarchy!: number;

    @prop()
    roleID?: string;

    @prop({ required: true })
    roleColor!: number;
}

class President extends PoliticalRole {
    name = "President";
    hierarchy = 0;
    roleColor = 0xff0000; // Red
}

class PrimeMinister extends PoliticalRole {
    name = "Prime Minister";
    hierarchy = 0;
    roleColor = 0xff0000; // Red
}

class HeadModerator extends PoliticalRole {
    name = "Head Moderator";
    hierarchy = 1;
    roleColor = 0xff8000; // Orange
}

class Senator extends PoliticalRole {
    name = "Senator";
    hierarchy = 2
    roleColor = 0x0000ff; // Blue
}

class Judge extends PoliticalRole {
    name = "Judge";
    hierarchy = 2;
    roleColor = 0xff00ff; // Purple
}

class Moderator extends PoliticalRole {
    name = "Moderator";
    hierarchy = 3; 
    roleColor = 0xffff00; // Orange
}

class Citizen extends PoliticalRole {
    name = "Citizen";
    hierarchy = 4; 
    roleColor = 0x00ff00; // Green
}

const PoliticalRoleObjectList: Array<new () => PoliticalRole> = [President, PrimeMinister, HeadModerator, Senator, Judge, Moderator, Citizen].sort((a, b) => a.prototype.hierarchy - b.prototype.hierarchy);

const PoliticalRoleModel = getModelForClass(PoliticalRole);

async function createPoliticalRoleDocuments(interaction: ChatInputCommandInteraction, politicalSytemType: PoliticalSystemsType, isCombinedCourt: boolean): Promise<PoliticalRoleHolder> {
    const guild = interaction.guild!;
    
    const roleHolder = new PoliticalRoleHolder();
    if (politicalSytemType === PoliticalSystemsType.Presidential) {
        roleHolder.President = await PoliticalRoleModel.create(await linkDiscordRole(guild, new President()));
    } else if (politicalSytemType === PoliticalSystemsType.Parliamentary) {
        roleHolder.PrimeMinister = await PoliticalRoleModel.create(await linkDiscordRole(guild, new PrimeMinister()));
    }
    if (politicalSytemType !== PoliticalSystemsType.DirectDemocracy) {
        roleHolder.Senator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Senator()));
    }
    if (!isCombinedCourt) {
        roleHolder.Judge = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Judge()));
    }
    // If Direct Democracy and appointModerators is false, no Moderator role is created
    roleHolder.HeadModerator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new HeadModerator()));
    roleHolder.Moderator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Moderator()));

    roleHolder.Citizen = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Citizen()));

    return roleHolder;
}

async function deletePoliticalRoleDocument<T extends PoliticalRole>(guild: Guild, _id: Ref<T>) {
    // Find role document
    const roleDocument = await PoliticalRoleModel.findOne({ _id });
    if (!roleDocument) {
        return;
    }

    await unlinkDiscordRole(guild, roleDocument.roleID);
    await PoliticalRoleModel.deleteOne({ _id });
}

async function linkDiscordRole<T extends PoliticalRole>(guild: Guild, role: T): Promise<T> {
    if (guild.roles.cache.size === 0) {
        await guild.roles.fetch();
    }
    const name = role.name;
    if (!role.roleID) { // If roleID is undefined, search for role with same name in server. 
        const existingRole = guild.roles.cache.find(r => r.name === name);
        if (existingRole) { //If it exists, delete it and create a new one.
            try {
                await unlinkDiscordRole(guild, existingRole.id);
                return await linkDiscordRole(guild, role);
            } catch (error) {
                console.error(`Failed to relink role ${name} in server ${guild.name}`);
            }
        } else { // If not, create a new one.
            try {
                const newRole = await guild.roles.create({
                    name: name,
                    permissions: [],
                    hoist: true,
                    reason: "Created Political Role"
                });
                role.roleID = newRole.id;
            } catch (error) {
                console.error(`Failed to create role ${name} in server ${guild.name}`);
            }
        }
    } else { // If roleID is defined and role with that ID doesn't exist, we change the roleID to the new one that we create.
        const existingRole = await guild.roles.fetch(role.roleID);
        if (!existingRole) {
            role.roleID = undefined;
            return await linkDiscordRole(guild, role);
        }
    }
    return role;
}

async function unlinkDiscordRole(guild: Guild, roleID: string | undefined) {
    if (roleID) {
        await guild.roles.delete(roleID, "Deleted Political Role");
    }
}

export default PoliticalRole;
export { President, PrimeMinister, Senator, Judge, HeadModerator, Moderator, Citizen, PoliticalRoleObjectList, PoliticalRoleModel }
export { createPoliticalRoleDocuments, deletePoliticalRoleDocument }