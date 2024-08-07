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
- Typegoose

## Current Bugs
Not checked for latest commit.

## TODO
### Active
- Add setup screens for "create" command for Elections (includes buttons to adjust term limits/lengths, or toggle certain options for DD)
- Move schemas to its own subdirectory under `src`
- Complete function to process our own permission system into discord permissions

### Future
- Add logging and command to view logs