# Vox-Populi
A democracy-simulating Discord bot in a server.

## Political Structure
When creating a new server, three political systems can be chosen: Presidential, Parliamentry and Direct Democracy.
These systems are similar with the exeption of the election process.

See [Political Structure](docs/politicalStructure) for more detailed information.

## Ownership
The bot should ideally own the server.
However, bots cannot create new guilds if they are in more than 10 servers.
So we will have to think of a way to work around this.

## Technologies
- Typescript
- Discord.js
- MongoDB
- Typegoose (Mongoose)

## Current Bugs
None, as of now.

## TODO
- Refactor Legislature to not depend on PoliticalRole
- Add all PoliticalRoles directly to PoliticalSystem

Possible Inheritance Model:

Guild
|- GuildCategory[]
    |- PoliticalChannel[]
|- PoliticalRole[]
    |- PoliticalPermissions
|- PoliticalSystem
    |- Legislature
    |- Moderation
    |- Court