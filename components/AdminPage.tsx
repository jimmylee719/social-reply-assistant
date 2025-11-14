import React, { useState, useEffect } from 'react';
import { User, Interaction, Goal } from '../types';
import { getAllUsers, getInteractionsForUser } from '../services/userService';
import { GOALS } from '../constants';


interface AdminPageProps {
  onLogout: () => void;
}

const goalLabelMap = GOALS.reduce((acc, goal) => {
    acc[goal.id] = goal.label;
    return acc;
}, {} as Record<Goal, string>);


export const AdminPage: React.FC<AdminPageProps> = ({ onLogout }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [interactions, setInteractions] = useState<Record<string, Interaction[]>>({});
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        setUsers(getAllUsers().filter(u => !u.isAdmin));
    }, []);

    const handleUserSelect = (userId: string) => {
        if (selectedUserId === userId) {
            setSelectedUserId(null); // Toggle off
        } else {
            const userInteractions = getInteractionsForUser(userId, 7);
            setInteractions(prev => ({ ...prev, [userId]: userInteractions }));
            setSelectedUserId(userId);
        }
    };

    return (
        <div className="min-h-screen container mx-auto p-4 md:p-8 animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">管理員後台</h1>
                <button onClick={onLogout} className="text-sm text-primary hover:underline">登出</button>
            </header>

            <div className="bg-surface p-6 rounded-2xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-4">用戶列表</h2>
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user.id}>
                            <button
                                onClick={() => handleUserSelect(user.id)}
                                className="w-full text-left p-4 bg-background rounded-lg border border-gray-700 hover:border-primary transition-colors duration-200 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold text-text-primary">{user.email}</p>
                                    <p className="text-sm text-text-secondary">性別: {user.gender === 'male' ? '男' : '女'}</p>
                                </div>
                                <span className={`transform transition-transform ${selectedUserId === user.id ? 'rotate-90' : ''}`}>▶</span>
                            </button>

                            {selectedUserId === user.id && (
                                <div className="p-4 bg-background/50 rounded-b-lg space-y-4">
                                    <h3 className="font-bold text-lg">最近 7 天活動紀錄</h3>
                                    {interactions[user.id] && interactions[user.id].length > 0 ? (
                                        interactions[user.id].map(interaction => (
                                            <div key={interaction.id} className="p-3 border-l-2 border-primary bg-gray-900/50 rounded-r-lg">
                                                <p className="text-sm text-text-secondary">{new Date(interaction.timestamp).toLocaleString()}</p>
                                                <p><span className="font-semibold">目標意圖:</span> {goalLabelMap[interaction.goal] || interaction.goal}</p>
                                                {interaction.conversation && <p className="mt-2"><span className="font-semibold">對話內容:</span><br/><span className="text-sm text-gray-400 whitespace-pre-wrap">{interaction.conversation}</span></p>}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-text-secondary">此用戶最近 7 天沒有活動紀錄。</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
