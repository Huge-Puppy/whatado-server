import  DataLoader from 'dataloader';
import { Group } from '../../entities/Group';

// keys is an array [1,2,3,4]
// [{id: 1, usernam...}, {}]
export const createGroupLoader = () => new DataLoader<number, Group>(async groupIds => {
    const groups = await Group.findByIds(groupIds as number[]);
    const groupIdToGroup: Record<number, Group> = {};
    groups.forEach(g => {
        groupIdToGroup[g.id] = g;
    });

    return groupIds.map(groupId => groupIdToGroup[groupId]);
})