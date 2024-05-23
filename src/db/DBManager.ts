import mongoose from 'mongoose';

import GuildModel from './schema/Guild.ts';

import constants from '../../constants.json';

class DBManager {
    UserModel: typeof GuildModel;

    constructor() {
        this.UserModel = GuildModel;
    }

    public async connect() {
        try {
            await mongoose.connect(constants.mongoURI);
            console.log('Connected to MongoDB!');
        } catch (err) {
            console.error(err);
        }
    }
}

export default DBManager;