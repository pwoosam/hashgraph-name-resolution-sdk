import { Client, TopicMessageQuery } from "@hashgraph/sdk";
import { NetworkType } from "../mirrorNode";
import { MessageObject } from "../types/MessageObject";

export class GRPCTopicSubscriber {
  static subscribe(
    networkType: NetworkType,
    topicId: string,
    onMessage: (message: MessageObject) => void,
    onCaughtUp: () => void,
    startingTimestamp: number = 0,
    ): () => void {
    let client = Client.forMainnet();
    if (networkType.includes('test')) {
      client = Client.forTestnet();
    } else if (networkType.includes('preview')) {
      client = Client.forPreviewnet();
    }

    let calledOnCaughtUp = false;

    const handle = new TopicMessageQuery()
      .setTopicId(topicId)
      .setStartTime(startingTimestamp)
      .subscribe(
        client,
        error => {
          console.error({
            err: error,
            message: (error as any).message
          });
        },
        responseObj => {
          const messages = responseObj.chunks.map((chunk): MessageObject => {
            return {
              topic_id: topicId,
              sequence_number: chunk.sequenceNumber.toNumber(),
              consensus_timestamp: chunk.consensusTimestamp.toString(),
              message: Buffer.from(chunk.contents).toString('utf-8'),
              running_hash: Buffer.from(chunk.runningHash).toString('utf-8'),
              running_hash_version: -1
            }
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
  };
}
