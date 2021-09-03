import DataLoader from "dataloader";
import { Chat } from "../../entities/Chat";

// keys is an array [1,2,3,4]
// [{id: 1, chatNotificationnam...}, {}]
export const createChatLoader = () =>
  new DataLoader<number, Chat>(async (chatIds) => {
    const chat = await Chat.findByIds(
      chatIds as number[]
    );
    const chatIdToChat: Record<
      number,
      Chat
    > = {};
    chat.forEach((id) => {
      chatIdToChat[id.id] = id;
    });

    return chatIds.map(
      (chatId) =>
        chatIdToChat[chatId]
    );
  });
