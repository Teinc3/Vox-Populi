# Vox-Populi
A democracy-simulating Discord bot in a server.

## Political Structure
When creating a new server, two political systems can be chosen: Presidential and Parliamentry.
These systems are similar with the exeption of the election process.

See [Political Structure](docs/politicalStructure) for more detailed information.

*Note: Only parliamentary system is implemented at the moment.*

## Ownership
The bot should ideally own the server.
However, bots cannot create new guilds if they are in more than 10 servers.
So we will have to think of a way to work around this.

## Technologies
- Discord.js
- MongoDB
- Typegoose
- Bun

## Current Bugs
- Cannot validate creation of some objects in dbmanager, as some fields are not being set during creation.
- Deploy commands gives negative response even if deployment was successful.

## TODO
- Refactor Legislature to not depend on PoliticalRole
- Add all PoliticalRoles directly to PoliticalSystem

Possible Inheritance Model:

Guild
|- PoliticalSystem
    |- Legislature
    |- Moderation
    |- Court
    |- PoliticalRole[] // Array/Set of roles
        |- PoliticalPermissions