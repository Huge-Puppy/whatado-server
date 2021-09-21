import DataLoader from "dataloader";
import { Forum } from "../../entities/Forum";

// keys is an array [1,2,3,4]
// [{id: 1, forumnam...}, {}]
export const createForumLoader = () =>
  new DataLoader<number, Forum>(async (forumIds) => {
    const forums = await Forum.findByIds(forumIds as number[]);
    const forumIdToForum: Record<number, Forum> = {};
    forums.forEach((id) => {
      forumIdToForum[id.id] = id;
    });

    return forumIds.map((forumId) => forumIdToForum[forumId]);
  });
