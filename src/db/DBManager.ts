import mongoose, { Document, Model } from 'mongoose';
import { type Ref, getModelForClass } from '@typegoose/typegoose';

import GuildModel from './schema/Guild.js';

import constants from '../data/constants.json' assert { type: 'json' };

class DBManager {
    model: typeof GuildModel;

    constructor() {
        this.model = GuildModel;
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