import  DataLoader from 'dataloader';
import { GroupIcon } from '../../entities/GroupIcon';

// keys is an array [1,2,3,4]
// [{id: 1, usernam...}, {}]
export const createGroupIconLoader = () => new DataLoader<number, GroupIcon>(async groupIconIds => {
    const groupIcons = await GroupIcon.findByIds(groupIconIds as number[]);
    const groupIconIdToGroup: Record<number, GroupIcon> = {};
    groupIcons.forEach(g => {
        groupIconIdToGroup[g.id] = g;
    });

    return groupIconIds.map(groupIconId => groupIconIdToGroup[groupIconId]);
})