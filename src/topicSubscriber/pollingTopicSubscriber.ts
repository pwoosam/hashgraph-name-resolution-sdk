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
    new Promise(async () => {
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

        
        
        if (messages.length === 0) {
          if (!calledOnCaughtUp) {
            onCaughtUp();
            calledOnCaughtUp = true;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          lastTimestamp = messages[messages.length - 1].consensus_timestamp;
        }
      }
    });

    // Return unsubscribe method
    return () => {
      cancelled = true;
    };
  };
}
