"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRPCTopicSubscriber = void 0;
const sdk_1 = require("@hashgraph/sdk");
class GRPCTopicSubscriber {
    static subscribe(networkType, topicId, onMessage, onCaughtUp, startingTimestamp = 0) {
        let client = sdk_1.Client.forMainnet();
        if (networkType.includes('test')) {
            client = sdk_1.Client.forTestnet();
        }
        else if (networkType.includes('preview')) {
            client = sdk_1.Client.forPreviewnet();
        }
        let calledOnCaughtUp = false;
        const handle = new sdk_1.TopicMessageQuery()
            .setTopicId(topicId)
            .setStartTime(startingTimestamp)
            .subscribe(client, error => {
            console.error({
                err: error,
                message: error.message
            });
        }, responseObj => {
            const messages = responseObj.chunks.map((chunk) => {
                return {
                    topic_id: topicId,
                    sequence_number: chunk.sequenceNumber.toNumber(),
                    consensus_timestamp: chunk.consensusTimestamp.toString(),
                    message: Buffer.from(chunk.contents).toString('utf-8'),
                    running_hash: Buffer.from(chunk.runningHash).toString('utf-8'),
                    running_hash_version: -1
                };
            });
            for (const message of messages) {
                onMessage(message);
            }
            if (!calledOnCaughtUp && messages.length < 100) {
                onCaughtUp();
                calledOnCaughtUp = true;
            }
        });
        return () => {
            handle.unsubscribe();
        };
    }
    ;
}
exports.GRPCTopicSubscriber = GRPCTopicSubscriber;
