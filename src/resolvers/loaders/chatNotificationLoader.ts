import DataLoader from "dataloader";
import { ChatNotification } from "../../entities/ChatNotification";

// keys is an array [1,2,3,4]
// [{id: 1, chatNotificationnam...}, {}]
export const createChatNotificationLoader = () =>
  new DataLoader<number, ChatNotification>(async (chatNotificationIds) => {
    const chatNotifications = await ChatNotification.findByIds(
      chatNotificationIds as number[]
    );
    const chatNotificationIdToChatNotification: Record<
      number,
      ChatNotification
    > = {};
    chatNotifications.forEach((id) => {
      chatNotificationIdToChatNotification[id.id] = id;
    });

    return chatNotificationIds.map(
      (chatNotificationId) =>
        chatNotificationIdToChatNotification[chatNotificationId]
    );
  });
