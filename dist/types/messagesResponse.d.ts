import { Links } from './Links';
import { MessageObject } from './MessageObject';
export default interface MessagesResponse {
    links: Links;
    messages: MessageObject[];
}
