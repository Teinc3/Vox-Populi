import {Client, GatewayIntentBits} from 'discord.js';

import type DBManager from "../db/DBManager.ts";

class DiscordManager {
    private dbManager: DBManager;

    private client: Client;
    private readonly intents: GatewayIntentBits;
    private readonly token: string;

    constructor(dbManager: DBManager, token: string) {
        this.dbManager = dbManager;

        this.intents = GatewayIntentBits.MessageContent | GatewayIntentBits.GuildMembers;
        this.client = new Client({intents: this.intents});
        this.token = token;

        this.setupGateway();
    }

    private setupGateway() {
        this.client.on('ready', () => {
            if (!this.client.user) return;
            console.log(`Logged in to Discord as ${this.client.user.tag}`);
        });
    }

    public async login() {
        await this.client.login(this.token);
    }
}

export default DiscordManager;