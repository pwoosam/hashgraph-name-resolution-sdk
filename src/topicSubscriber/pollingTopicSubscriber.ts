import axios from "axios";
import { getBaseUrl, MAX_PAGE_SIZE, NetworkType } from "../mirrorNode";
import { MessageObject } from "../types/MessageObject";
import MessagesResponse from "../types/MessagesResponse";

const sendGetRequest = async (url: string, authKey?: string) => {
  try {
    const headers: any = {};
    if (authKey) {
      headers['Authorization'] = authKey;
    }

    const res = await axios.get(url, {
      headers
    });

    return res.data as MessagesResponse;
  } catch (err) {
    throw new Error('Get Request Failed');
  }
};

export class PollingTopicSubscriber {
  static subscribe(
    networkType: NetworkType,
    topicId: string,
    onMessage: (message: MessageObject) => void,
    onCaughtUp: () => void,
    startingTimestamp: string = `000`,
    authKey?: string,
  ): () => void {
    let lastTimestamp = startingTimestamp;
    let calledOnCaughtUp = false;
    let cancelled = false;
    const promise = new Promise<void>(async (resolve) => {
      while (!cancelled) {
        const url = `${getBaseUrl(networkType)}/api/v1/topics/${topicId}/messages/?limit=${MAX_PAGE_SIZE}&timestamp=gt:${lastTimestamp}`;
        const response = await sendGetRequest(url, authKey).catch((err) => {
          console.error({
            err,
            message: err.message
          });
        });
        if (!response) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        const messages = response.messages ? response.messages : [];
  
        for (const message of messages) {
          if (!cancelled) {
            onMessage(message);
          }
        }

        if (!calledOnCaughtUp && messages.length < MAX_PAGE_SIZE) {
          onCaughtUp();
          calledOnCaughtUp = true;
        }
        if (messages.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          lastTimestamp = messages[messages.length - 1].consensus_timestamp;
        }
      }

      resolve();
    });

    // Return unsubscribe method
    return async () => {
      cancelled = true;
      await promise;
    };
  };
}
