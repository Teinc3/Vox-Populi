import { prop, Ref } from "@typegoose/typegoose";

import type PoliticalRole from "../roles/PoliticalRole";

// If array is empty then everyone has that perm there (provided they can Access the channel)
// but if it's [VoxPopuli] then nobody has that perm (apart from the bot)
type RefRoleArray = Ref<PoliticalRole>[];

class ChannelPermissions {
    // Who can see the channel
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanView!: RefRoleArray;

    // Who can use bot functionality, as well as make threads and react emojis
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanInteract!: RefRoleArray;

    // Who can send messages/join voice channels
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanSend!: RefRoleArray;

    // Who can manage messages
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanModerate!: RefRoleArray;

    // Who can manage channel (incl. its permissions)
    @prop({ required: true, default: new Array<Ref<PoliticalRole>>(), ref: () => 'PoliticalRole' })
    whoCanManage!: RefRoleArray;
}

function filterRefRoleArray(refRoleArray: Array<Ref<PoliticalRole> | undefined>): Ref<PoliticalRole>[] {
    return refRoleArray.filter((role): role is Ref<PoliticalRole> => role !== undefined);
}

export default ChannelPermissions;
export { filterRefRoleArray };