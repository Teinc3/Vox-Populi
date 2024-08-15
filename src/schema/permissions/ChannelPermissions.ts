import { prop, Ref } from "@typegoose/typegoose";

import type PoliticalRole from "../roles/PoliticalRole";
import { ChannelType, OverwriteData, PermissionsBitField } from "discord.js";
import { PoliticalRoleModel, VoxPopuli } from "../roles/PoliticalRole.js";

// If array is empty then everyone has that perm there (provided they can Access the channel)
// but if it's [VoxPopuli] then nobody has that perm (apart from the bot)
type RefRoleArray = Ref<PoliticalRole>[];

/**
 * Represents simplified permissions for a Discord channel.
 * 
 * Scenarios:
 * - Array is non-empty: All roles in the arrays have the permission allowed, while `@everyone` has the permission denied.
 * - Array is empty: `@everyone` has the permission allowed.
 * - Array contains only Vox Populi: `@everyone` has the permission denied.
 * 
 * @class
 */
class ChannelPermissions {
    /**
     * Who can view the channel
     * 
     * Permissions:
     * - View Channel
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanView!: RefRoleArray;

    /**
     * Who can interact with the channel
     * 
     * Permissions:
     * - Create Public and Private Threads
     * - Send Messages in Threads
     * - Add Reactions
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanInteract!: RefRoleArray;

    /**
     * Who can send messages in the channel
     * 
     * Permissions:
     * - Send Messages
     * - Use Application Commands, Activities, and External Apps
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanSend!: RefRoleArray;

    /**
     * Who can moderate the channel
     * 
     * Permissions:
     * - Manage Messages
     * - Manage Threads
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanModerate!: RefRoleArray;

    /**
     * Who can manage the channel
     * 
     * Permissions:
     * - Manage Channel
     * - Manage Permissions
     * - Manage Webhooks
     */
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanManage!: RefRoleArray;
}

function filterRefRoleArray(refRoleArray: Array<Ref<PoliticalRole> | undefined>): Ref<PoliticalRole>[] {
    return refRoleArray.filter((role): role is Ref<PoliticalRole> => role !== undefined);
}

const discordPermissionOverwritesReference = {
    whoCanView: [PermissionsBitField.Flags.ViewChannel],
    whoCanInteract: [PermissionsBitField.Flags.AddReactions],
    whoCanSend: [PermissionsBitField.Flags.SendMessages |
        PermissionsBitField.Flags.CreatePublicThreads | PermissionsBitField.Flags.CreatePrivateThreads | PermissionsBitField.Flags.SendMessagesInThreads |
        PermissionsBitField.Flags.UseApplicationCommands | PermissionsBitField.Flags.UseEmbeddedActivities | BigInt(1 << 50)] /* USE_EXTERNAL_APPS is still in dev build*/,
    whoCanModerate: [PermissionsBitField.Flags.ManageMessages],
    whoCanManage: [PermissionsBitField.Flags.ManageChannels | PermissionsBitField.Flags.ManageRoles | PermissionsBitField.Flags.ManageWebhooks]
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

    const permissionOverwritesArray: Array<OverwriteData> = [everyonePermissionOverwrites];

    for (const key in channelPermissions) {
        const refRoleArray = channelPermissions[key as keyof ChannelPermissions];
        const permissions = discordPermissionOverwritesReference[key as keyof typeof discordPermissionOverwritesReference];
        if (refRoleArray.length === 0) {
            everyonePermissionOverwrites.allow.add(permissions);
        } else {
            if (refRoleArray.length === 1) {
                const roleDocument = refRoleArray[0];
                const politicalRoleObject = await PoliticalRoleModel.findOne({ _id: roleDocument });

                if (politicalRoleObject?.name === new VoxPopuli().name) {
                    everyonePermissionOverwrites.deny!.add(permissions);
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
                
                permissionOverwritesArray.push(permissionOverwrites);
            }
        }
    }

    // Finally, return the permission overwrites
    return permissionOverwritesArray;
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