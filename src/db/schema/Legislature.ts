import { prop } from '@typegoose/typegoose';

import { Senator } from "./PoliticalRole.js";

class Legislature {
    @prop({ required: true })
    memberCount!: number;

    // Or put channels under "Category subclass"
    /*@prop({ required: true })
    channelID!: number;*/
}

class Senate extends Legislature {
    @prop({ default: [] })
    members!: Senator[];
}

export default Legislature;
export { Senate };