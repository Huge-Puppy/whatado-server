import  DataLoader from 'dataloader';
import { User } from '../../entities/User';

// keys is an array [1,2,3,4]
// [{id: 1, usernam...}, {}]
export const createUserLoader = () => new DataLoader<number, User>(async userIds => {
    const users = await User.findByIds(userIds as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach(u => {
        userIdToUser[u.id] = u;
    });

    return userIds.map(userId => userIdToUser[userId]);
})