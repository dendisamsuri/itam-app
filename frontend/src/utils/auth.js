import { dataService } from './dataService';

export const getUserPayload = async () => {
    return await dataService.getUserPayload();
};

export const logout = async () => {
    return await dataService.logout();
};
