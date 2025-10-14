'use server';

// Re-export all functions from their new location in members.ts
export { 
    getUserByUid,
    getUserByUsername,
    checkUsernameExists,
    generateUniqueUsername,
    searchUsers,
    saveWaNumber,
    verifyWaNumber,
    updateUserProfile,
    processVerificationSubmission,
    getUserUplineStructure,
    requestDataDeletion,
    deleteUserAccount,
    getUserByWaNumber
} from './members';
