import type { KeysMap } from "./generics.js";


export enum PoliticalRoleHierarchy {
  VoxPopuli,
  President,
  PrimeMinister,
  HeadModerator,
  Moderator,
  Senator,
  Judge,
  Citizen,
  Undocumented
}

type HierarchyKeysMap = KeysMap<typeof PoliticalRoleHierarchy>;

/*
 * Now you might ask, why not just use the strings directly? This just seems like overkill and messy.
 * But if you replace any of the the keys below with another string, the compiler will throw an error.
 * This ensures that the keys are always mapped with the enum's, so you can't accidentally use the wrong key by writing down the wrong string.
 */
type BaseRoles = {
  required: HierarchyKeysMap["VoxPopuli"] | HierarchyKeysMap["Citizen"] | HierarchyKeysMap["Undocumented"];
  optional: HierarchyKeysMap["President"] | HierarchyKeysMap["PrimeMinister"] | HierarchyKeysMap["HeadModerator"] | HierarchyKeysMap["Moderator"] | HierarchyKeysMap["Senator"] | HierarchyKeysMap["Judge"];
};

export type PoliticalRoleHolderInterface<T> = {
  [key in BaseRoles["required"]]: T;
} & Partial<{
  [key in BaseRoles["optional"]]: T;
}>

export enum PermissionsLevel {
  emergency,
  manage,
  moderate,
  interact,
  send,
  view
}

type BasePermission = keyof KeysMap<typeof PermissionsLevel>;

export type PermissionsHolderInterface<T, Optional extends boolean = false> = {
  [key in BasePermission as key extends "emergency" ? (Optional extends false ? never : key) : key]: T;
};

export interface PermissionsCategory {
  overwrites: bigint[];
  static: bigint[];
}

//type PermissionsHolder<T> = PermissionsHolderInterface<Array<T>, true>;

export type PermissionsOverwriteHolder<T> = PermissionsHolderInterface<Array<T>, false>;

export type PermissionsOverwriteEnumKeyHolder = PermissionsOverwriteHolder<keyof typeof PoliticalRoleHierarchy>;

type PermissionsAggregate<T> = Partial<{ start: T, end: T }>;

export type BasePermissionsAggregate = PermissionsAggregate<BasePermission>;

export type PermissionsLevelAggregate = PermissionsAggregate<PermissionsLevel>;