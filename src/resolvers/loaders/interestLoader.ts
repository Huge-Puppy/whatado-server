
import  DataLoader from 'dataloader';
import { Interest } from '../../entities/Interest';

// keys is an array [1,2,3,4]
// [{id: 1, interestnam...}, {}]
export const createInterestLoader = () => new DataLoader<number, Interest>(async interestIds => {
    const interests = await Interest.findByIds(interestIds as number[]);
    const interestIdToInterest: Record<number, Interest> = {};
    interests.forEach(id => {
        interestIdToInterest[id.id] = id;
    });

    return interestIds.map(interestId => interestIdToInterest[interestId]);
})