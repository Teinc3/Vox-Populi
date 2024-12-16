import ChannelPermissions from "../schema/permissions/ChannelPermissions.js";
import type { KeysMap } from "./generics.js";

export interface ChannelInterface {
    name: string;
    description: string;
    channelPermissions: ChannelPermissions;
    channelID?: string;
    logChannel?: LogChannelType;
}

export enum AbstractChannelType {
    /**
     * Default unused value that represents a Generic, untracked Text channel. 
     */
    Generic = "Generic",
    /**
     * Represents a tracked Text channel. Typically associated with Political entities.
     */
    Political = "Political",
    /**
     * Represents a tracked Ticket Channel.
     */
    Ticket = "Ticket",
    /**
     * Represents a tracked Log Channel.
     */
    Log = "Log"
}

export enum LogChannelType {
    Server = "Server",
    Chat = "Chat",
}

type LogChannelTypeKeysMap = KeysMap<typeof LogChannelType>

export type LogChannelTypeKeys = LogChannelTypeKeysMap[keyof LogChannelTypeKeysMap];