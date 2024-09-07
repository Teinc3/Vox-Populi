import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { type ColorResolvable, type Guild, type Role } from 'discord.js';

import PoliticalRoleHolder from './PoliticalRoleHolder.js';

import { PoliticalRoleHierarchy } from '../../types/types.js';
import { GuildConfigData } from '../../types/wizard.js';
import { BasePermissionsAggregate, parsePermissionsAggregate, progressivePermissionsAllocator } from '../../types/permissions.js';

class PoliticalRole {
    @prop({ required: true })
    name!: string;
    
    @prop({ required: true, enum: () => PoliticalRoleHierarchy })
    hierarchy!: PoliticalRoleHierarchy;

    @prop({ unique: true })
    roleID?: string;

    @prop({ required: true })
    roleColor!: string;

    @prop({ type: () => [BigInt], required: true })
    permissions!: bigint[];

    // These are user-customizable options
    constructor(name: string, color: string, hierarchy: PoliticalRoleHierarchy, basePermissionsAggregate?: BasePermissionsAggregate, id?: string) {
        this.name = name;
        this.roleColor = color;
        this.hierarchy = hierarchy;

        if (id) {
            this.roleID = id;
        }

        this.permissions = progressivePermissionsAllocator(parsePermissionsAggregate(basePermissionsAggregate));
    }

    static async createPoliticalRoleDocuments(guild: Guild, guildConfigData: GuildConfigData, reason?: string): Promise<PoliticalRoleHolder> {
        const { filteredRoles } = guildConfigData.discordOptions.roleOptions;
        const roleHolder = new PoliticalRoleHolder();
    
        for (const role of filteredRoles) {
            const politicalRole = new PoliticalRole(role.name, role.color, role.hierarchy, role.basePermissions, role.id);
            await politicalRole.linkDiscordRole(guild, reason);
            const politicalRoleRef = await PoliticalRoleModel.create(politicalRole);
            roleHolder[PoliticalRoleHierarchy[role.hierarchy] as keyof typeof PoliticalRoleHierarchy] = politicalRoleRef;
        }
    
        return roleHolder;
    }

    static async deletePoliticalRoleDocument(guild: Guild, politicalRoleDocument: Ref<PoliticalRole>, deleteObjects: boolean, reason?: string) {
        // Find role document
        const roleDocument = await PoliticalRoleModel.findOneAndDelete({ _id: politicalRoleDocument });
        if (!roleDocument) {
            return;
        }
    
        if (deleteObjects) {
            // Delete the discord role
            await roleDocument.deleteDiscordRole(guild, reason);
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
    async linkDiscordRole(guild: Guild, reason?: string) {
        if (guild.roles.cache.size === 0) {
            await guild.roles.fetch();
        }
        let discordRole: Role | null | undefined;
        if (this.roleID) { // If roleID is undefined, search for role with same name in server. 
            discordRole = await guild.roles.fetch(this.roleID);
            if (discordRole) {
                // We found a role, now we set its permissions and position (later).
                discordRole.setPermissions(this.permissions);
                return;
            }
            // Else Fallback
        }
        // Search for a role with the same name in the server.
        discordRole = guild.roles.cache.find(r => r.name === this.name);
        if (discordRole) { // If it exists, Link it and set its new position (later)
            this.roleID = discordRole.id;
            discordRole.setPermissions(this.permissions);

        } else { // If not, create a new one.
            try {
                discordRole = await guild.roles.create({
                    name: this.name,
                    permissions: this.permissions,
                    hoist: true,
                    color: this.roleColor as ColorResolvable,
                    reason
                });
                this.roleID = discordRole.id;
            } catch (error) {
                console.error(`Failed to create role ${this.name} in server ${guild.name}`);
            }
        }
        return;
    }

    async deleteDiscordRole(guild: Guild, reason?: string) {
        if (this.roleID && this.roleID !== guild.id) {
            await guild.roles.delete(this.roleID, reason);
        }
    }
}

const PoliticalRoleModel = getModelForClass(PoliticalRole);

export default PoliticalRole;
export { PoliticalRoleModel }