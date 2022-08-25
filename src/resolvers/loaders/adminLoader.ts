import  DataLoader from 'dataloader';
import { Admin } from 'src/entities/Admin';

// keys is an array [1,2,3,4]
// [{id: 1, usernam...}, {}]
export const createAdminLoader = () => new DataLoader<number, Admin>(async () => {
    const admins = await Admin.find();

    return admins;
})