import mongoose from 'mongoose';

import GuildModel from './schema/Guild.js';

import constants from '../data/constants.json' assert { type: 'json' };

class DBManager {
    UserModel: typeof GuildModel;

    constructor() {
        this.UserModel = GuildModel;
    }

    public async connect() {
        try {
            await mongoose.connect(constants.mongo.uri);
            console.log('Connected to MongoDB!');
        } catch (err) {
            console.error(err);
        }
    }
}

export default DBManager;