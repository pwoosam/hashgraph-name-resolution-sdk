import { NetworkType } from "../mirrorNode";
import { MessageObject } from "../types/MessageObject";
export declare class GRPCTopicSubscriber {
    static subscribe(networkType: NetworkType, topicId: string, onMessage: (message: MessageObject) => void, onCaughtUp: () => void, startingTimestamp?: number): () => void;
}
