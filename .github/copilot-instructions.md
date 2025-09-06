### **Repository Prompt for Github Copilot: Vox-Populi**

Hello Copilot. You are an expert AI assistant helping me work on **Vox-Populi**, a TypeScript-based Discord bot that simulates complex political systems within a Discord server. Please use the following context to understand the project's architecture, goals, and current state.

### **1. High-Level Project Goal**

The primary goal of Vox-Populi is to allow a Discord server to be configured with one of three political systems: **Presidential**, **Parliamentary**, or **Direct Democracy**. The bot manages the creation of roles, channels, permissions, and the processes (like elections and voting) that govern the server's political life. The entire system is highly configurable through a detailed setup wizard.

### **2. Core Concepts & Database Schema**

The project uses **Typegoose** with **MongoDB** to model its data. The schema is heavily nested and relies on composition and discriminators.

* **`PoliticalGuild`**: The root document for a server configuration. It links to all other major components.
* **`PoliticalSystem`**: A discriminated model that can be `Presidential`, `Parliamentary`, or `DirectDemocracy`. This is the central "constitution" of the server.
    * **`Presidential`**: Has a `President` role and configurable term limits. Elections are separate from the legislature.
    * **`Parliamentary`**: Has a `Prime Minister` role, and its key feature is the configurable `snapElection` mechanic. Power is derived from the legislature.
    * **`DirectDemocracy` (DD)**: Discards executive roles. Power is held by `Citizen` roles. Key options include `appointModerators` and `appointJudges`, which determine if citizens delegate these powers or hold them collectively.
* **`Chamber`**: Represents the legislative and judicial bodies. The legislature is currently **unicameral** (a single chamber called the "Senate" or "Referendum").
* **`PoliticalRole` & `PoliticalRoleHolder`**: Defines the hierarchy of roles (e.g., `President`, `Senator`, `Citizen`, `Resident`). `PoliticalRoleHolder` is a central document that holds references to all `PoliticalRole` documents for a guild.
* **`AbstractChannel` & `GuildCategory`**: Manages the creation and configuration of bot-related channels. Channels are organized into categories like "executive" and "legislature." The bot is designed to automatically recreate its channels if they are deleted manually.
* **Collectors (`TicketCollector`, etc.)**: Manages interactive messages with buttons, such as the citizenship application form.

### **3. Technology Stack**

* **Language**: TypeScript
* **Framework**: Discord.js v14
* **Database**: MongoDB with Mongoose
* **ORM**: Typegoose (This is crucial. Pay close attention to decorators like `@prop`, `@modelOptions`, and the use of discriminators).

### **4. Current State & Immediate Goals**

The project has a solid foundation, but key interactive features are missing.

**What's DONE:**
* A comprehensive `/config init` wizard for setting up all three political systems.
* A robust and detailed database schema using Typegoose.
* Automatic creation of roles and channels based on the configuration.
* A basic, automated citizenship application system.

**HIGH-PRIORITY TODOs (This is what we are working on now):**
1.  **Implement the Voting System**: This is the top priority. We need to create a `/vote` command, a `VoteCollector` class, and the backend logic to handle elections and referendums.
2.  **Flesh out the `EventHandler`**: The `EventHandler` needs to be implemented to enforce time-based rules from the configuration, such as term limits and snap election cooldowns.
3.  **Implement In-Game Commands**: We need commands for users to interact with the system, such as a command to propose a bill or file a court case.

### **5. Coding Style and Principles**

* **Single Responsibility Principle (SRP)**: The code is highly modular. Schemas and classes are designed to do one thing well.
* **Composition over Inheritance**: The system is built on composing many small, focused classes rather than large, monolithic ones.
* **Type Safety**: Adhere strictly to TypeScript types. The project uses many custom types defined in the `/src/types/` directory.
* **Asynchronous Operations**: Almost all operations involving Discord.js or the database are asynchronous. Use `async/await` correctly.
* **Immutability (where possible)**: When processing data from the wizard or events, treat it as immutable to avoid side effects.

Please use this context to provide accurate, relevant, and high-quality code suggestions. Focus on the high-priority tasks, especially the **voting system**.