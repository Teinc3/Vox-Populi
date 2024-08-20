import { prop, Ref } from "@typegoose/typegoose";

import type PoliticalRole from "../roles/PoliticalRole";
import { OverwriteData, PermissionsBitField } from "discord.js";
import { PoliticalRoleModel, VoxPopuli } from "../roles/PoliticalRole.js";

import { PermissionsCategories } from "../../types/permissions.js";
import { CustomPermissionsOverwrite } from "../../types/types";

// If array is empty then everyone has that perm there (provided they can Access the channel)
// but if it's [VoxPopuli] then nobody has that perm (apart from the bot)
export type RefRoleArray = Ref<PoliticalRole>[];
export type UnfilteredRefRoleArray = Array<Ref<PoliticalRole> | undefined>;

/**
 * Represents simplified permissions for a Discord channel.
 * 
 * Scenarios:
 * - Array is non-empty: All roles in the arrays have the permission allowed, while `@everyone` has the permission denied.
 * - Array is empty: follow default Discord permissions.
 * - Array contains only Vox Populi (0): `@everyone` has the permission denied.
 * 
 * @class
 */
class ChannelPermissions implements CustomPermissionsOverwrite<Ref<PoliticalRole>> {
    /**
     * Who can view the channel
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    view!: RefRoleArray;

    /**
     * Who can interact with the channel
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    interact!: RefRoleArray;

    /**
     * Who can send messages in the channel
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    send!: RefRoleArray;

    /**
     * Who can moderate the channel
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    moderate!: RefRoleArray;

    /**
     * Who can manage the channel
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    manage!: RefRoleArray;
}

function filterRefRoleArray(refRoleArray: UnfilteredRefRoleArray): RefRoleArray {
    return refRoleArray.filter((role): role is Ref<PoliticalRole> => role !== undefined);
}

const discordPermissionOverwritesReference = {
    view: PermissionsCategories.view.overwrites,
    send: PermissionsCategories.send.overwrites,
    interact: PermissionsCategories.interact.overwrites,
    moderate: PermissionsCategories.moderate.overwrites,
    manage: PermissionsCategories.manage.overwrites
};

async function createChannelPermissionsOverwrite(guildID: string, channelPermissions: ChannelPermissions): Promise<OverwriteData[]> {
    // First get all the roles specified in the object
    const allRoleDocuments = new Set<Ref<PoliticalRole>>();
    for (const key in channelPermissions) {
        const refRoleArray = channelPermissions[key as keyof ChannelPermissions];
        refRoleArray.forEach(role => allRoleDocuments.add(role));
    }

    const allRoles: Array<RolePopulated> = [];
    const rolePromises = Array.from(allRoleDocuments).map(async roleDocument => {
        const roleObject = await PoliticalRoleModel.findOne({ _id: roleDocument });
        if (roleObject && roleObject.roleID) {
            return {
                roleID: roleObject.roleID,
                roleDocument,
                permissionOverwrites: {
                    id: roleObject.roleID,
                    allow: new PermissionsBitField(),
                    deny: new PermissionsBitField()
                }
            };
        }
        return null;
    });
    
    const resolvedRoles = await Promise.all(rolePromises);
    resolvedRoles.forEach(role => {
        if (role) {
            allRoles.push(role);
        }
    });

    // Now we can set the permissions
    const everyonePermissionOverwrites = {
        id: guildID,
        allow: new PermissionsBitField(),
        deny: new PermissionsBitField()
    };
    let hasOverwrites = false;

    const permissionOverwritesArray: Array<OverwriteData> = [everyonePermissionOverwrites];

    for (const key in channelPermissions) {
        const refRoleArray = channelPermissions[key as keyof ChannelPermissions];
        const permissions = discordPermissionOverwritesReference[key as keyof typeof discordPermissionOverwritesReference];
        if (refRoleArray.length !== 0) {
            if (refRoleArray.length === 1) {
                const roleDocument = refRoleArray[0];
                const politicalRoleObject = await PoliticalRoleModel.findOne({ _id: roleDocument });

                if (politicalRoleObject?.name === new VoxPopuli().name) {
                    everyonePermissionOverwrites.deny!.add(permissions);
                    hasOverwrites = true;
                    continue;
                }
            }

            for (const roleDocument of refRoleArray) {
                const rolePopulated = allRoles.find(role => role.roleDocument === roleDocument);
                if (!rolePopulated) {
                    continue;
                }

                const { permissionOverwrites } = rolePopulated;
                permissionOverwrites.allow.add(permissions);
                everyonePermissionOverwrites.deny!.add(permissions);
                hasOverwrites = true;
                
                permissionOverwritesArray.push(permissionOverwrites);
            }
        }
    }

    // Finally, return the permission overwrites
    return hasOverwrites ? permissionOverwritesArray : [];
}

interface RolePopulated {
    roleID: string;
    roleDocument: Ref<PoliticalRole>;
    permissionOverwrites: {
        id: string;
        allow: PermissionsBitField;
        deny: PermissionsBitField;
    };
}

export default ChannelPermissions;
export { filterRefRoleArray, createChannelPermissionsOverwrite };