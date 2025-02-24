import { NetworkType } from "../mirrorNode";
import { MessageObject } from "../types/MessageObject";
export declare const executeWithRetriesAsync: <T>(func: (retryNum: number) => Promise<T>, shouldRetry: (err: any) => boolean, maxRetries?: number) => Promise<T>;
export declare class PollingTopicSubscriber {
    static subscribe(networkType: NetworkType, topicId: string, onMessage: (message: MessageObject) => void, onCaughtUp: () => void, startingTimestamp?: string, authKey?: string): () => void;
}
