import mongoose from 'mongoose';
import GuildModel from './schema/Guild.ts';

import constants from '../../constants.json';

class DBManager {
    UserModel: typeof GuildModel;

    constructor() {
        this.UserModel = GuildModel;
    }

    async connect() {
        try {
            await mongoose.connect(constants.mongoURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useCreateIndex: true,
                useFindAndModify: false
            } as mongoose.ConnectOptions);
            console.log('Connected to MongoDB!');
        } catch (err) {
            console.error(err);
        }
    }
}

export default DBManager;