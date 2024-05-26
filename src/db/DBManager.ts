import mongoose from 'mongoose';
import type { DocumentType } from '@typegoose/typegoose';

import GuildModel, { GuildSchema } from './schema/Guild.js';
import PoliticalSystem, { PoliticalSystemModel, politicalSystemCreationTriage } from './schema/PoliticalSystem.js';
import Legislature, { LegislatureModel, legislatureCreationTriage } from './schema/Legislature.js';
import PoliticalRole, { PoliticalRoleModel, politicalSystemRoleCreationTriage } from './schema/PoliticalRole.js';

import constants from '../data/constants.json' assert { type: 'json' };
import { PoliticalSystemsType } from '../types/static.js';

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

    public async createGuildDocument(guildID: string, system: PoliticalSystemsType, isBotOwner: boolean): Promise<boolean> {
        const guildData = {
            guildID,
            isBotOwner
        } as GuildSchema;

        try {
            const existingGuild = await this.getGuildObject(guildID);
            if (existingGuild !== null) {
                return false;
            }

            const savedSystem = await this.createNewPoliticalSystemGeneric(system, PoliticalSystemModel, politicalSystemCreationTriage);
            if (!savedSystem) {
                return false; // Return false if political system could not be saved
            }

            const savedLegislature = await this.createNewPoliticalSystemGeneric(system, LegislatureModel, legislatureCreationTriage)
            if (!savedLegislature) {
                return false; // Return false if legislature could not be saved
            }

            const savedHOS = await this.createNewPoliticalSystemGeneric(system, PoliticalRoleModel, politicalSystemRoleCreationTriage);
            if (!savedHOS) {
                return false; // Return false if head of state could not be saved
            }

            // Save political permissions for the HOS in question.

            savedSystem.headOfState = savedHOS._id;
            savedSystem.legislature = savedLegislature._id;
            guildData.politicalSystem = savedSystem._id;

            await this.model.create(guildData);
            return true;

        } catch (err) {
            // Handle error
            console.error(err);
            return false; // Return false if an error occurred
        }
    }

    public async getGuildObject(guildID: string): Promise<GuildSchema | null> {
        try {
            const guild = await this.model.findOne({ guildID });
            return guild;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    private async createNewPoliticalSystemGeneric<T extends PoliticalSystem<PoliticalRole> | Legislature<PoliticalRole> | PoliticalRole>(
        politicalSystemType: PoliticalSystemsType,
        model: mongoose.Model<T>,
        creationTriage: (politicalSystemType: PoliticalSystemsType) => T
    ): Promise<DocumentType<T> | null> {
        const politicalSystemObject = creationTriage(politicalSystemType);
        try {
            const politicalSystem = await model.create(politicalSystemObject);
            return politicalSystem as DocumentType<T>;
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}

export default DBManager;