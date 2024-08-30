import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { type ColorResolvable, type Guild, type Role } from 'discord.js';

import PoliticalRoleHolder from './PoliticalRolesHolder.js';

import { GuildConfigData } from '../../types/types.js';
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

    // These are user-customizable options
    constructor(name: string, color: string, id?: string) {
        this.name = name;
        this.roleColor = color;
        this.roleID = id;
    }
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

const PoliticalRoleModel = getModelForClass(PoliticalRole);

async function createPoliticalRoleDocuments(guild: Guild, guildConfigData: GuildConfigData, reason?: string): Promise<PoliticalRoleHolder> {
    const { filteredRoles } = guildConfigData.discordOptions.roleOptions;
    const roleHolder = new PoliticalRoleHolder();

    roleHolder.VoxPopuli = await PoliticalRoleModel.create(await linkDiscordRole(guild, new VoxPopuli(filteredRoles.VoxPopuli.name, filteredRoles.VoxPopuli.color, filteredRoles.VoxPopuli.id), reason));
    if (filteredRoles.President) {
        roleHolder.President = await PoliticalRoleModel.create(await linkDiscordRole(guild, new President(filteredRoles.President.name, filteredRoles.President.color, filteredRoles.President.id), reason));
    }
    if (filteredRoles.PrimeMinister) {
        roleHolder.PrimeMinister = await PoliticalRoleModel.create(await linkDiscordRole(guild, new PrimeMinister(filteredRoles.PrimeMinister.name, filteredRoles.PrimeMinister.color, filteredRoles.PrimeMinister.id), reason));
    }
    if (filteredRoles.HeadModerator) {
        roleHolder.HeadModerator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new HeadModerator(filteredRoles.HeadModerator.name, filteredRoles.HeadModerator.color, filteredRoles.HeadModerator.id), reason));
    }
    if (filteredRoles.Moderator) {
        roleHolder.Moderator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Moderator(filteredRoles.Moderator.name, filteredRoles.Moderator.color, filteredRoles.Moderator.id), reason));
    }
    if (filteredRoles.Senator) {
        roleHolder.Senator = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Senator(filteredRoles.Senator.name, filteredRoles.Senator.color, filteredRoles.Senator.id), reason));
    }
    if (filteredRoles.Judge) {
        roleHolder.Judge = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Judge(filteredRoles.Judge.name, filteredRoles.Judge.color, filteredRoles.Judge.id), reason));
    }
    roleHolder.Citizen = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Citizen(filteredRoles.Citizen.name, filteredRoles.Citizen.color, filteredRoles.Citizen.id), reason));
    roleHolder.Undocumented = await PoliticalRoleModel.create(await linkDiscordRole(guild, new Undocumented(filteredRoles.Undocumented.name, filteredRoles.Undocumented.color, filteredRoles.Undocumented.id), reason));

    return roleHolder;
}

async function deletePoliticalRoleDocument<T extends PoliticalRole>(guild: Guild, politicalRoleDocument: Ref<T>, deleteObjects: boolean, reason?: string) {
    // Find role document
    const roleDocument = await PoliticalRoleModel.findOneAndDelete({ _id: politicalRoleDocument });
    if (!roleDocument) {
        return;
    }

    if (deleteObjects) {
        // Delete the discord role
        await deleteDiscordRole(guild, roleDocument.roleID, reason);
    }
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
    if (roleObject.roleID) { // If roleID is undefined, search for role with same name in server. 
        discordRole = await guild.roles.fetch(roleObject.roleID);
        if (discordRole) {
            // We found a role, now we set its permissions and position (later).
            discordRole.setPermissions(roleObject.permissions);
            return roleObject;
        }
        // Else Fallback
    }
    // Search for a role with the same name in the server.
    discordRole = guild.roles.cache.find(r => r.name === name);
    if (discordRole) { // If it exists, Link it and set its new position (later)
        roleObject.roleID = discordRole.id;
        discordRole.setPermissions(roleObject.permissions);

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
    return roleObject;
}

async function deleteDiscordRole(guild: Guild, roleID: string | undefined, reason?: string) {
    if (roleID && roleID !== guild.id) {
        await guild.roles.delete(roleID, reason);
    }
}

export default PoliticalRole;
export { VoxPopuli, President, PrimeMinister, Senator, Judge, HeadModerator, Moderator, Citizen, Undocumented, PoliticalRoleModel }
export { createPoliticalRoleDocuments, deletePoliticalRoleDocument, progressivePermissionsAllocator }