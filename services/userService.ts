import { User, Gender, Target, TargetProfile, Interaction } from '../types';

const USERS_KEY = 'social_assistant_users';
const TARGETS_KEY = 'social_assistant_targets';
const INTERACTIONS_KEY = 'social_assistant_interactions';

// --- Hashing Simulation (NOT FOR PRODUCTION) ---
// In a real app, use a library like bcrypt. This is a simple reversible "hash".
const simpleHash = (s: string) => btoa(s);
const compareHash = (s: string, hashed: string) => btoa(s) === hashed;

// --- Initialization ---
const initializeData = () => {
    if (!localStorage.getItem(USERS_KEY)) {
        const adminUser: User = {
            id: 'admin-user',
            email: 'test@mail.com',
            passwordHash: simpleHash('1234'),
            gender: Gender.Male,
            isAdmin: true
        };
        const jimmyUser: User = {
            id: 'jimmy-user',
            email: 'jimmy@mail.com',
            passwordHash: simpleHash('1234'),
            gender: Gender.Male,
            isAdmin: false
        };
        localStorage.setItem(USERS_KEY, JSON.stringify([adminUser, jimmyUser]));
        localStorage.setItem(TARGETS_KEY, JSON.stringify([]));
        localStorage.setItem(INTERACTIONS_KEY, JSON.stringify([]));
    }
};

initializeData();

// --- User Management ---
export const registerUser = (email: string, password: string, gender: Gender): User | null => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return null; // User already exists
    }
    const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        passwordHash: simpleHash(password),
        gender,
        isAdmin: false
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
};

export const loginUser = (email: string, password: string): User | null => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && compareHash(password, user.passwordHash)) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }
    return null;
};

export const logoutUser = () => {
    sessionStorage.removeItem('currentUser');
};

export const getCurrentUser = (): User | null => {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
};

export const getAllUsers = (): User[] => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
};

export const updateUserGender = (userId: string, gender: Gender): User | null => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex].gender = gender;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Also update session storage if it's the current user
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const updatedCurrentUser = { ...currentUser, gender };
            sessionStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            return updatedCurrentUser;
        }
        return users[userIndex];
    }
    return null;
}

// --- Target Management ---
export const getTargetsForUser = (userId: string): Target[] => {
    const allTargets: Target[] = JSON.parse(localStorage.getItem(TARGETS_KEY) || '[]');
    return allTargets.filter(t => t.userId === userId);
};

export const addTarget = (userId: string, name: string): Target => {
    const targets = getTargetsForUser(userId);
    const newTarget: Target = {
        id: `target-${Date.now()}`,
        userId,
        name,
        profile: { nationality: '', age: '', education: '', job: '', bodyType: '', religion: '', diet: '', interests: '' }
    };
    const allTargets: Target[] = JSON.parse(localStorage.getItem(TARGETS_KEY) || '[]');
    allTargets.push(newTarget);
    localStorage.setItem(TARGETS_KEY, JSON.stringify(allTargets));
    return newTarget;
};

export const updateTargetProfile = (targetId: string, profile: TargetProfile): Target | null => {
    const allTargets: Target[] = JSON.parse(localStorage.getItem(TARGETS_KEY) || '[]');
    const targetIndex = allTargets.findIndex(t => t.id === targetId);
    if (targetIndex > -1) {
        allTargets[targetIndex].profile = profile;
        localStorage.setItem(TARGETS_KEY, JSON.stringify(allTargets));
        return allTargets[targetIndex];
    }
    return null;
}

// --- Interaction Management ---
export const saveInteraction = (interaction: Omit<Interaction, 'id' | 'timestamp'>) => {
    const allInteractions: Interaction[] = JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '[]');
    const newInteraction: Interaction = {
        ...interaction,
        id: `interaction-${Date.now()}`,
        timestamp: Date.now()
    };
    allInteractions.push(newInteraction);
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(allInteractions));
};

export const getInteractionsForUser = (userId: string, days: number = 7): Interaction[] => {
    const allInteractions: Interaction[] = JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '[]');
    const cutOffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    return allInteractions
        .filter(i => i.userId === userId && i.timestamp >= cutOffDate)
        .sort((a, b) => b.timestamp - a.timestamp);
};