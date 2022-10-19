import DataLoader from "dataloader";
import { FriendRequest } from "../../entities/FriendRequest";

// keys is an array [1,2,3,4]
// [{id: 1, wannagonam...}, {}]
export const createFriendRequestLoader = () =>
  new DataLoader<number, FriendRequest>(async (friendRequestIds) => {
    const friendRequests = await FriendRequest.findByIds(friendRequestIds as number[], {
      relations: ["requested", "requester"],
    });
    const frIdToFr: Record<number, FriendRequest> = {};
    friendRequests.forEach((id) => {
      frIdToFr[id.id] = id;
    });

    return friendRequestIds.map((frId) => frIdToFr[frId]);
  });
