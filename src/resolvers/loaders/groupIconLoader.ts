import  DataLoader from 'dataloader';
import { GroupIcon } from '../../entities/GroupIcon';

// keys is an array [1,2,3,4]
// [{id: 1, usernam...}, {}]
export const createGroupIconLoader = () => new DataLoader<number, GroupIcon>(async groupIds => {
    const groups = await GroupIcon.findByIds(groupIds as number[]);
    const groupIdToGroup: Record<number, GroupIcon> = {};
    groups.forEach(g => {
        groupIdToGroup[g.id] = g;
    });

    return groupIds.map(groupId => groupIdToGroup[groupId]);
})