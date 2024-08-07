import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import type { ColorResolvable, Guild } from 'discord.js';

import { PoliticalSystemsType } from '../../types/static.js';
import PoliticalRoleHolder from './PoliticalRolesHolder.js';

import { type DDChamberOptions } from '../../types/static.js';
import constants from '../../data/constants.json' assert { type: "json" };

class PoliticalRole {
    @prop({ required: true })
    name!: string;
    
    @prop({ required: true })
    hierarchy!: number;

    @prop()
    roleID?: string;

    @prop({ required: true })
    roleColor!: string;
}

class VoxPopuli extends PoliticalRole {
    name = constants.roles.VoxPopuli.name;
    hierarchy = constants.roles.VoxPopuli.hierarchy;
    roleColor = constants.roles.VoxPopuli.color; // White
}

class President extends PoliticalRole {
    name = constants.roles.President.name;
    hierarchy = constants.roles.President.hierarchy;
    roleColor = constants.roles.President.color // Red
}

class PrimeMinister extends PoliticalRole {
    name = constants.roles.PrimeMinister.name;
    hierarchy = constants.roles.PrimeMinister.hierarchy;
    roleColor = constants.roles.PrimeMinister.color; // Red
}

class HeadModerator extends PoliticalRole {
    name = constants.roles.HeadModerator.name;
    hierarchy = constants.roles.HeadModerator.hierarchy;
    roleColor = constants.roles.HeadModerator.color; // Orange
}

class Senator extends PoliticalRole {
    name = constants.roles.Senator.name;
    hierarchy = constants.roles.Senator.hierarchy;
    roleColor = constants.roles.Senator.color; // Blue
}

class Judge extends PoliticalRole {
    name = constants.roles.Judge.name;
    hierarchy = constants.roles.Judge.hierarchy;
    roleColor = constants.roles.Judge.color; // Purple
}

class Moderator extends PoliticalRole {
    name = constants.roles.Moderator.name;
    hierarchy = constants.roles.Moderator.hierarchy;
    roleColor = constants.roles.Moderator.color; // Yellow
}

class Citizen extends PoliticalRole {
    name = constants.roles.Citizen.name;
    hierarchy = constants.roles.Citizen.hierarchy;
    roleColor = constants.roles.Citizen.color; // Green
}

const PoliticalRoleObjectList: Array<new () => PoliticalRole> = [VoxPopuli, President, PrimeMinister, HeadModerator, Senator, Judge, Moderator, Citizen].sort((a, b) => a.prototype.hierarchy - b.prototype.hierarchy);

const PoliticalRoleModel = getModelForClass(PoliticalRole);

async function createPoliticalRoleDocuments(guild: Guild, politicalSytemType: PoliticalSystemsType, chamberOptions: DDChamberOptions, reason?: string): Promise<PoliticalRoleHolder> {

    const roleHolder = new PoliticalRoleHolder();
    roleHolder.VoxPopuli = await PoliticalRoleModel.create(await linkDiscordRole(guild, new VoxPopuli(), reason));

    if (politicalSytemType === PoliticalSystemsType.Presidential) {
        roleHolder.President = await PoliticalRoleModel.create(await linkDiscordRole(guild, new President(), reason));
    } else if (politicalSytemType === PoliticalSystemsType.Parliamentary) {
        roleHolder.PrimeMinister = await PoliticalRoleModel.create(await linkDiscordRole(guild, new PrimeMinister(), reason));
    }

    if (politicalSytemType !== PoliticalSystemsType.DirectDemocracy) {
        roleHolder.Senator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Senator(), reason));
    }

    // For Direct Democracy, citizens can choose to appoint judges and moderators through referendums
    if (!chamberOptions.isDD || chamberOptions.appointJudges) {
        roleHolder.Judge = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Judge(), reason));
    }
    if (!chamberOptions.isDD || chamberOptions.appointModerators) {
        roleHolder.HeadModerator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new HeadModerator(), reason));
        roleHolder.Moderator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Moderator(), reason));
    }

    roleHolder.Citizen = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Citizen(), reason));

    return roleHolder;
}

async function deletePoliticalRoleDocument<T extends PoliticalRole>(guild: Guild, _id: Ref<T>, reason?: string) {
    // Find role document
    const roleDocument = await PoliticalRoleModel.findOneAndDelete({ _id });
    if (!roleDocument) {
        return;
    }

    await unlinkDiscordRole(guild, roleDocument.roleID, reason);
}

async function linkDiscordRole<T extends PoliticalRole>(guild: Guild, role: T, reason?: string): Promise<T> {
    if (guild.roles.cache.size === 0) {
        await guild.roles.fetch();
    }
    const name = role.name;
    if (!role.roleID) { // If roleID is undefined, search for role with same name in server. 
        const existingRole = guild.roles.cache.find(r => r.name === name);
        if (existingRole) { //If it exists, delete it and create a new one.
            try {
                await unlinkDiscordRole(guild, existingRole.id, reason);
                return await linkDiscordRole(guild, role, reason);
            } catch (error) {
                console.error(`Failed to relink role ${name} in server ${guild.name}`);
            }
        } else { // If not, create a new one.
            try {
                const newRole = await guild.roles.create({
                    name: name,
                    permissions: [],
                    hoist: true,
                    color: role.roleColor as ColorResolvable,
                    reason
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

async function unlinkDiscordRole(guild: Guild, roleID: string | undefined, reason?: string) {
    if (roleID) {
        await guild.roles.delete(roleID, reason);
    }
}

export default PoliticalRole;
export { VoxPopuli, President, PrimeMinister, Senator, Judge, HeadModerator, Moderator, Citizen, PoliticalRoleObjectList, PoliticalRoleModel }
export { createPoliticalRoleDocuments, deletePoliticalRoleDocument }