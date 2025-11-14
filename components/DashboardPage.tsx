import React, { useState, useEffect } from 'react';
import { User, Target } from '../types';
import { getTargetsForUser, addTarget } from '../services/userService';

interface DashboardPageProps {
  user: User;
  onStartAssistant: (target: Target) => void;
  onLogout: () => void;
  onShowProfile: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onStartAssistant, onLogout, onShowProfile }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [newTargetName, setNewTargetName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setTargets(getTargetsForUser(user.id));
  }, [user.id]);

  const handleAddTarget = () => {
    if (newTargetName.trim()) {
      const newTarget = addTarget(user.id, newTargetName.trim());
      setTargets(prev => [...prev, newTarget]);
      setNewTargetName('');
      setIsAdding(false);
      onStartAssistant(newTarget);
    }
  };

  return (
    <div className="min-h-screen container mx-auto p-4 md:p-8 animate-fade-in">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">對話儀表板</h1>
            <div className="flex items-center gap-4">
                <button 
                    onClick={onShowProfile} 
                    className="px-4 py-2 bg-surface text-text-secondary font-semibold rounded-lg hover:bg-gray-600 transition-colors shadow-md text-sm"
                >
                    個人資訊
                </button>
                <button 
                    onClick={onLogout} 
                    className="px-6 py-3 bg-red-800/80 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md"
                >
                    登出
                </button>
            </div>
        </header>
        
        <div className="bg-surface p-6 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">選擇或建立對話目標</h2>
            
            <div className="space-y-3 mb-6">
                {targets.length > 0 ? (
                    targets.map(target => (
                        <button 
                            key={target.id}
                            onClick={() => onStartAssistant(target)}
                            className="w-full text-left p-4 bg-background rounded-lg border border-gray-700 hover:border-primary transition-colors duration-200"
                        >
                            <p className="font-semibold text-lg text-text-primary">{target.name}</p>
                        </button>
                    ))
                ) : (
                    !isAdding && <p className="text-text-secondary text-center p-4">您還沒有建立任何對話目標。點擊下方按鈕開始！</p>
                )}
            </div>

            {isAdding ? (
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={newTargetName}
                        onChange={(e) => setNewTargetName(e.target.value)}
                        placeholder="輸入對方的名字或暱稱"
                        className="flex-grow p-3 bg-background rounded-lg border border-gray-600 focus:ring-2 focus:ring-primary"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTarget()}
                    />
                    <button onClick={handleAddTarget} className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-focus">儲存</button>
                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500">取消</button>
                </div>
            ) : (
                <div className="text-center">
                    <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-focus transition-transform transform hover:scale-105">
                        + 建立新目標
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};