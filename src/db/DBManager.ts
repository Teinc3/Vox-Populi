import mongoose from 'mongoose';
import type { DocumentType } from '@typegoose/typegoose';

import GuildModel, { GuildSchema } from './schema/Guild.js';
import PoliticalSystem, { PoliticalSystemModel, Presidential, Parliamentary } from './schema/PoliticalSystem.js';
import Legislature, { LegislatureModel, Senate, Referendum } from './schema/Legislature.js';
import PoliticalRole, { PoliticalRoleModel, President, PrimeMinister } from './schema/PoliticalRole.js';

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

    public async createGuildDocument(guildID: string, prefix: string, system: string): Promise<boolean> {
        const guildData = {
            guildID,
            prefix
        } as GuildSchema;

        try {
            const existingGuild = this.getGuildObject(guildID);
            if (existingGuild === null) {
                return false;
            }

            // Save Head of State with model and embed political permissions (N/A for now)
            const savedHOS = await this.createPoliticalRole(system === 'presidential' ? 'president' : 'primeMinister');
            if (!savedHOS) {
                return false; // Return false if head of state could not be saved
            }

            // Save Legislature with model
            const savedLegislature = await this.createLegislature(system !== 'presidential');
            if (!savedLegislature) {
                return false; // Return false if legislature could not be saved
            }

            // Save Political System with model and embed legislature and head of state
            const savedSystem = await this.createPoliticalSystem(system);
            if (!savedSystem) {
                return false; // Return false if political system could not be saved
            }

            savedSystem.headOfState = savedHOS._id;
            savedSystem.legislature = savedLegislature._id;

            // Set political system reference
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

    private async createPoliticalSystem(system: string): Promise<DocumentType<PoliticalSystem<PoliticalRole>> | null> {
        let politicalSystemObject: PoliticalSystem<PoliticalRole>
        switch (system) {
            case 'presidential':
                politicalSystemObject = new Presidential();
                break;
            case 'parliamentary':
                politicalSystemObject = new Parliamentary();
                break;
            default:
                return null;
        }

        try {
            const politicalSystem = await PoliticalSystemModel.create(politicalSystemObject);
            return politicalSystem;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    // Rework isSenate to use enums?
    private async createLegislature(isSenate: boolean): Promise<DocumentType<Legislature<PoliticalRole>> | null> {
        let legislatureObject: Legislature<PoliticalRole>;
        if (isSenate) {
            legislatureObject = new Senate();
        } else {
            legislatureObject = new Referendum();
        }

        try {
            const legislature = await LegislatureModel.create(legislatureObject);
            return legislature;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    private async createPoliticalRole(hos: string): Promise<DocumentType<PoliticalRole> | null> {
        let politicalRoleObject: PoliticalRole;
        switch (hos) {
            case 'president':
                politicalRoleObject = new President();
                break;
            case 'primeMinister':
                politicalRoleObject = new PrimeMinister();
                break;
            default:
                return null;
        }
        try {
            const politicalRole = await PoliticalRoleModel.create(politicalRoleObject);
            return politicalRole;
        } catch (err) {
            console.error(err);
            return null;
        }
        
    }
}

export default DBManager;

/* Refactor idea
enum SystemType {
    Presidential = 'presidential',
    Parliamentary = 'parliamentary'
}

enum RoleType {
    President = 'president',
    PrimeMinister = 'primeMinister'
}

enum LegislatureType {
    Senate = 'senate',
    Referendum = 'referendum'
}

private async createDocument<T extends mongoose.Document>(
    model: mongoose.Model<T>, 
    type: SystemType | RoleType | LegislatureType
): Promise<T | null> {
    let doc: T;
    switch (type) {
        case SystemType.Presidential:
            doc = new Presidential() as T;
            break;
        case SystemType.Parliamentary:
            doc = new Parliamentary() as T;
            break;
        case RoleType.President:
            doc = new President() as T;
            break;
        case RoleType.PrimeMinister:
            doc = new PrimeMinister() as T;
            break;
        case LegislatureType.Senate:
            doc = new Senate() as T;
            break;
        case LegislatureType.Referendum:
            doc = new Referendum() as T;
            break;
        default:
            return null;
    }

    try {
        const savedDoc = await model.create(doc);
        return savedDoc;
    } catch (err) {
        console.error(err);
        return null;
    }
}

public async createGuildDocument(guildID: string, prefix: string, system: SystemType): Promise<boolean> {
    const guildData = {
        guildID,
        prefix
    } as GuildSchema;

    try {
        const existingGuild = this.getGuildObject(guildID);
        if (existingGuild === null) {
            return false;
        }

        const savedHOS = await this.createDocument(PoliticalRoleModel, system === SystemType.Presidential ? RoleType.President : RoleType.PrimeMinister);
        if (!savedHOS) {
            return false;
        }

        const savedLegislature = await this.createDocument(LegislatureModel, system !== SystemType.Presidential ? LegislatureType.Senate : LegislatureType.Referendum);
        if (!savedLegislature) {
            return false;
        }

        const savedSystem = await this.createDocument(PoliticalSystemModel, system);
        if (!savedSystem) {
            return false;
        }

        savedSystem.headOfState = savedHOS._id;
        savedSystem.legislature = savedLegislature._id;

        guildData.politicalSystem = savedSystem._id;
        await this.model.create(guildData);

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}
*/