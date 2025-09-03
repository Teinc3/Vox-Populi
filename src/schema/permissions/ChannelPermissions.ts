import { OverwriteData, PermissionsBitField } from "discord.js";
import { prop, type Ref } from "@typegoose/typegoose";

import { PoliticalRoleModel } from "../roles/PoliticalRole.js";
import { discordPermissionOverwritesReference } from "../../utils/permissionsHelper.js";
import { PoliticalRoleHierarchy, type PermissionsOverwriteHolder } from "../../types/permissions.js";

import type PoliticalRole from "../roles/PoliticalRole";


// If array is empty then everyone has that perm there (provided they can Access the channel)
// but if it's [VoxPopuli] then nobody has that perm (apart from the bot)
export type RefRoleArray = Ref<PoliticalRole>[];
export type UnfilteredRefRoleArray = Array<Ref<PoliticalRole> | undefined>;
export type ChannelPermissionsInterface = PermissionsOverwriteHolder<Ref<PoliticalRole>>;

interface RolePopulated {
  roleObject: PoliticalRole;
  roleDocument: Ref<PoliticalRole>;
  permissionOverwrites: {
    id: string;
    allow: PermissionsBitField;
    deny: PermissionsBitField;
  };
}

/**
 * Represents simplified permissions for a Discord channel.
 * 
 * Scenarios:
 * 1. Array is non-empty - Two Cases:
 *   - If `PoliticalRoleHierarchy.Undocumented` (*@everyone*) is present in the array,
 * then all roles in the array that are listed before Undocumented have the permission allowed,
 * and the roles after Undocumented have the permission denied. Undocumented stays neutral.
 *   - Otherwise, all roles in the arrays have the permission allowed, while *@everyone* has the permission denied.
 * 2. Array is empty: follow default Discord permissions.
 * 3. Array contains only `PoliticalRoleHierarchy.VoxPopuli`: *@everyone* has the permission denied.
 * 
 * @class
 */
class ChannelPermissions implements ChannelPermissionsInterface {
  /**
     * Who can view the channel
     */
  @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
  view!: RefRoleArray;

  /**
     * Who can send messages in the channel
     */
  @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
  send!: RefRoleArray;

  /**
     * Who can interact with the channel.
     * 
     * Note:
     * - This does not include interacting with the Bot's messages.
     * For example, a Citizen may not be able to react emojis to the election collector, but still be able to vote through the Bot's functionality.
     * 
     * - This is a catch-all for all interactions that are not covered by the lower permissions (view, send).
     */
  @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
  interact!: RefRoleArray;

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

  static filterRefRoleArray(refRoleArray: UnfilteredRefRoleArray): RefRoleArray {
    return refRoleArray.filter((role): role is Ref<PoliticalRole> => role !== undefined);
  }

  async createChannelPermissionsOverwrite(guildID: string): Promise<OverwriteData[]> {
    // First get all the roles specified in the object
    const allRoleDocuments = new Set<Ref<PoliticalRole>>();
    for (const key in this) {
      const refRoleArray = this[key as keyof ChannelPermissionsInterface];
      if (typeof refRoleArray === 'function') {
        continue;
      }
      refRoleArray.forEach(role => allRoleDocuments.add(role));
    }
    
    const allRoles: Array<RolePopulated> = [];
    const rolePromises = Array.from(allRoleDocuments).map(async roleDocument => {
      const roleObject = await PoliticalRoleModel.findById(roleDocument);
      if (roleObject && roleObject.roleID) {
        return {
          roleObject,
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
    
    for (const key in this) {
      const refRoleArray = this[key as keyof ChannelPermissionsInterface];
      const permissions = discordPermissionOverwritesReference[key as keyof typeof discordPermissionOverwritesReference];
      if (typeof refRoleArray === 'function') {
        continue;
      }
      if (refRoleArray.length !== 0) {
        if (refRoleArray.length === 1) {
          const roleDocument = refRoleArray[0];
          const politicalRoleObject = allRoles.find(role => role.roleDocument === roleDocument)?.roleObject;
    
          if (politicalRoleObject?.hierarchy === PoliticalRoleHierarchy.VoxPopuli) {
            everyonePermissionOverwrites.deny!.add(permissions);
            hasOverwrites = true;
            continue;
          }
        }

        // Search refRoleArray for any document that has hierarchy of Undocumented
        const hasUndocumented = allRoles.some(role => refRoleArray.includes(role.roleDocument) && role.roleObject.hierarchy === PoliticalRoleHierarchy.Undocumented);
        let beforeUndocumented = true;

        for (const roleDocument of refRoleArray) {
          const rolePopulated = allRoles.find(role => role.roleDocument === roleDocument);
          if (!rolePopulated) {
            continue;
          }
    
          const { permissionOverwrites } = rolePopulated;
          if (hasUndocumented) {
            if (rolePopulated.roleObject.hierarchy !== PoliticalRoleHierarchy.Undocumented) {
              if (beforeUndocumented) {
                permissionOverwrites.allow.add(permissions);
              } else {
                permissionOverwrites.deny.add(permissions);
              }
            } else {
              beforeUndocumented = false;
              continue;
            }
          } else {
            permissionOverwrites.allow.add(permissions);
            everyonePermissionOverwrites.deny.add(permissions);
          }

          hasOverwrites = true;
          permissionOverwritesArray.push(permissionOverwrites);
        }
      }
    }
    
    // Finally, return the permission overwrites
    return hasOverwrites ? permissionOverwritesArray : [];
  }
}

export default ChannelPermissions;