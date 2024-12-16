export type KeysMap<T> = {
    [key in keyof T]: key
};