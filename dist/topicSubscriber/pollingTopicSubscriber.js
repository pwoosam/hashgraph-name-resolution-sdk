"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollingTopicSubscriber = void 0;
const axios_1 = __importDefault(require("axios"));
const mirrorNode_1 = require("../mirrorNode");
const sendGetRequest = async (url, authKey) => {
    try {
        const headers = {};
        if (authKey) {
            headers['Authorization'] = authKey;
        }
        const res = await axios_1.default.get(url, {
            headers
        });
        return res.data;
    }
    catch (err) {
        throw new Error('Get Request Failed');
    }
};
class PollingTopicSubscriber {
    static subscribe(networkType, topicId, onMessage, onCaughtUp, startingTimestamp = `000`, authKey) {
        let lastTimestamp = startingTimestamp;
        let calledOnCaughtUp = false;
        let cancelled = false;
        const promise = new Promise(async (resolve) => {
            while (!cancelled) {
                const url = `${(0, mirrorNode_1.getBaseUrl)(networkType)}/api/v1/topics/${topicId}/messages/?limit=${mirrorNode_1.MAX_PAGE_SIZE}&timestamp=gt:${lastTimestamp}`;
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
                if (!calledOnCaughtUp && messages.length < mirrorNode_1.MAX_PAGE_SIZE) {
                    onCaughtUp();
                    calledOnCaughtUp = true;
                }
                if (messages.length === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
                else {
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
    }
    ;
}
exports.PollingTopicSubscriber = PollingTopicSubscriber;
