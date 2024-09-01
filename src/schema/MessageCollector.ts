import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';
import { MessageCollectorType } from '../types/types';

class MessageCollector {
    @prop({ required: true })
    public guildID!: string;

    @prop({ required: true })
    public channelID!: string;

    @prop({ required: true })
    public messageID!: string;

    @prop({ required: true })
    public shouldPin!: boolean;

    @prop({ required: true, enum: () => MessageCollectorType })
    public type!: MessageCollectorType;
}

async function linkDiscordMessageCollector() {
    
}

const MessageCollectorModel = getModelForClass(MessageCollector);

export default MessageCollectorModel;
export { MessageCollector };