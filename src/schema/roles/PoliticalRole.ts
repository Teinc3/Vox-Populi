import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { type ColorResolvable, type Guild, type Role } from 'discord.js';

import PoliticalRoleHolder from './PoliticalRolesHolder.js';

import { GuildConfigData, PoliticalSystemsType } from '../../types/types.js';
import { PermissionsCategories, PermissionsLevel } from '../../types/permissions.js';
import roleDefaults from '../../data/defaults/roles.json' assert { type: "json" };

class PoliticalRole {
    @prop({ required: true })
    name!: string;
    
    @prop({ required: true })
    hierarchy!: number;

    @prop()
    roleID?: string;

    @prop({ required: true })
    roleColor!: string;

    @prop({ type: () => [BigInt], required: true })
    permissions!: bigint[];
}

/**
 * Automatically assigns all permissions from the highest permission level the role has to the lowest
 * 
 * @param start The index of the highest permission level the role has, inclusive
 * @param end The index of the lowest permission level the role has, inclusive
 * @returns An array of permissions
 */
function progressivePermissionsAllocator(start: PermissionsLevel, end?: PermissionsLevel): bigint[] {
    const permissions: bigint[] = [];
    const categoriesArray = Object.values(PermissionsCategories);

    // Assuming categoriesArray is already sorted by permission levels
    for (let i = start; i <= (end ?? categoriesArray.length - 1); i++) {
        permissions.push(...categoriesArray[i].static, ...categoriesArray[i].overwrites);
    }
    return permissions;
}

class VoxPopuli extends PoliticalRole {
    name = roleDefaults.VoxPopuli.name;
    hierarchy = roleDefaults.VoxPopuli.hierarchy;
    roleColor = roleDefaults.VoxPopuli.color; // White
    permissions = progressivePermissionsAllocator(PermissionsLevel.Emergency, PermissionsLevel.Emergency);
}

class President extends PoliticalRole {
    name = roleDefaults.President.name;
    hierarchy = roleDefaults.President.hierarchy;
    roleColor = roleDefaults.President.color // Red
    permissions = progressivePermissionsAllocator(PermissionsLevel.Manage, PermissionsLevel.Moderate);
}

class PrimeMinister extends PoliticalRole {
    name = roleDefaults.PrimeMinister.name;
    hierarchy = roleDefaults.PrimeMinister.hierarchy;
    roleColor = roleDefaults.PrimeMinister.color; // Red
    permissions = progressivePermissionsAllocator(PermissionsLevel.Manage, PermissionsLevel.Moderate);
}

class HeadModerator extends PoliticalRole {
    name = roleDefaults.HeadModerator.name;
    hierarchy = roleDefaults.HeadModerator.hierarchy;
    roleColor = roleDefaults.HeadModerator.color; // Orange
    permissions = progressivePermissionsAllocator(PermissionsLevel.Moderate, PermissionsLevel.Moderate);
}

class Moderator extends PoliticalRole {
    name = roleDefaults.Moderator.name;
    hierarchy = roleDefaults.Moderator.hierarchy;
    roleColor = roleDefaults.Moderator.color; // Yellow
    permissions = progressivePermissionsAllocator(PermissionsLevel.Moderate, PermissionsLevel.Moderate);
}

class Senator extends PoliticalRole {
    name = roleDefaults.Senator.name;
    hierarchy = roleDefaults.Senator.hierarchy;
    roleColor = roleDefaults.Senator.color; // Blue
    permissions = new Array<bigint>();
}

class Judge extends PoliticalRole {
    name = roleDefaults.Judge.name;
    hierarchy = roleDefaults.Judge.hierarchy;
    roleColor = roleDefaults.Judge.color; // Purple
    permissions = new Array<bigint>();
}

class Citizen extends PoliticalRole {
    name = roleDefaults.Citizen.name;
    hierarchy = roleDefaults.Citizen.hierarchy;
    roleColor = roleDefaults.Citizen.color; // Green
    permissions = progressivePermissionsAllocator(PermissionsLevel.Interact, PermissionsLevel.Interact);
}

class Undocumented extends PoliticalRole {
    name = roleDefaults.Undocumented.name;
    hierarchy = roleDefaults.Undocumented.hierarchy;
    roleColor = roleDefaults.Undocumented.color; // Gray
    permissions = progressivePermissionsAllocator(PermissionsLevel.Send);
}

const PoliticalRoleObjectList: Array<new () => PoliticalRole> = [VoxPopuli, President, PrimeMinister, HeadModerator, Moderator, Senator, Judge, Citizen/*, Undocumented*/].sort((a, b) => a.prototype.hierarchy - b.prototype.hierarchy);

const PoliticalRoleModel = getModelForClass(PoliticalRole);

async function createPoliticalRoleDocuments(guild: Guild, guildConfigData: GuildConfigData, reason?: string): Promise<PoliticalRoleHolder> {

    const politicalSystemType = guildConfigData.politicalSystem;

    const roleHolder = new PoliticalRoleHolder();
    roleHolder.VoxPopuli = await PoliticalRoleModel.create(await linkDiscordRole(guild, new VoxPopuli(), reason));

    if (politicalSystemType === PoliticalSystemsType.Presidential) {
        roleHolder.President = await PoliticalRoleModel.create(await linkDiscordRole(guild, new President(), reason));
    } else if (politicalSystemType === PoliticalSystemsType.Parliamentary) {
        roleHolder.PrimeMinister = await PoliticalRoleModel.create(await linkDiscordRole(guild, new PrimeMinister(), reason));
    }

    // For Direct Democracy, citizens can choose to appoint judges and moderators through referendums
    if (politicalSystemType !== PoliticalSystemsType.DirectDemocracy || guildConfigData.ddOptions!.appointModerators) {
        roleHolder.HeadModerator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new HeadModerator(), reason));
        roleHolder.Moderator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Moderator(), reason));
    }

    if (politicalSystemType !== PoliticalSystemsType.DirectDemocracy) {
        roleHolder.Senator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Senator(), reason));
    }

    if (politicalSystemType !== PoliticalSystemsType.DirectDemocracy || guildConfigData.ddOptions!.appointJudges) {
        roleHolder.Judge = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Judge(), reason));
    }

    roleHolder.Citizen = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Citizen(), reason));

    const UndocumentedObject = new Undocumented();
    UndocumentedObject.roleID = guild.id;
    roleHolder.Undocumented = await PoliticalRoleModel.create(await linkDiscordRole(guild, UndocumentedObject, reason));

    return roleHolder;
}

async function deletePoliticalRoleDocument<T extends PoliticalRole>(guild: Guild, politicalRoleDocument: Ref<T>, reason?: string) {
    // Find role document
    const roleDocument = await PoliticalRoleModel.findOneAndDelete({ _id: politicalRoleDocument });
    if (!roleDocument) {
        return;
    }

    await unlinkDiscordRole(guild, roleDocument.roleID, reason);
}

/**
 * Function that links a Discord Role to a PoliticalRole Object.
 * 
 * Scenarios:
 * - Given a PoliticalRole Object with a roleID, if the role with that ID doesn't exist, it will search for a role with the same name in the server.
 * - If the role with the same name also doesn't exist, it will then create a new role.
 * - Otherwise, it will update the role's permissions and position.
 */
async function linkDiscordRole<T extends PoliticalRole>(guild: Guild, roleObject: T, reason?: string): Promise<T> {
    if (guild.roles.cache.size === 0) {
        await guild.roles.fetch();
    }
    const name = roleObject.name;
    let discordRole: Role | null | undefined;
    if (!roleObject.roleID) { // If roleID is undefined, search for role with same name in server. 
        discordRole = guild.roles.cache.find(r => r.name === name);
        if (discordRole) { // If it exists, Link it and pull it to the bottom of the hierarchy.
            roleObject.roleID = discordRole.id;     
        } else { // If not, create a new one.
            try {
                discordRole = await guild.roles.create({
                    name: name,
                    permissions: roleObject.permissions,
                    hoist: true,
                    color: roleObject.roleColor as ColorResolvable,
                    reason
                });
                roleObject.roleID = discordRole.id;
            } catch (error) {
                console.error(`Failed to create role ${name} in server ${guild.name}`);
            }
        }
    } else { // If roleID is defined and role with that ID doesn't exist, we change the roleID to the new one that we create.
        discordRole = await guild.roles.fetch(roleObject.roleID);
        if (!discordRole && roleObject.roleID !== guild.id) {
            roleObject.roleID = undefined;
            return await linkDiscordRole(guild, roleObject);
        }
    }
    if (discordRole?.editable) {
        await discordRole.setPermissions(roleObject.permissions);
    }
    return roleObject;
}

async function unlinkDiscordRole(guild: Guild, roleID: string | undefined, reason?: string) {
    if (roleID && roleID !== guild.id) {
        await guild.roles.delete(roleID, reason);
    }
}

export default PoliticalRole;
export { VoxPopuli, President, PrimeMinister, Senator, Judge, HeadModerator, Moderator, Citizen, Undocumented, PoliticalRoleObjectList, PoliticalRoleModel }
export { createPoliticalRoleDocuments, deletePoliticalRoleDocument, progressivePermissionsAllocator }