import React, { useState } from 'react';
import { User, Gender } from '../types';
import { GENDERS } from '../constants';
import { updateUserGender } from '../services/userService';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
  const [selectedGender, setSelectedGender] = useState<Gender>(user.gender);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    const updatedUser = updateUserGender(user.id, selectedGender);
    if (updatedUser) {
      onSave(updatedUser);
    }
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-6 text-center">個人資訊</h2>
        
        <div className="mb-6">
            <p className="text-sm text-gray-300 text-center mb-2">電子郵件</p>
            <p className="text-center font-semibold bg-gray-900 p-3 rounded-lg">{user.email}</p>
        </div>

        <div className="mb-8">
          <label className="block mb-2 text-sm font-medium text-gray-300 text-center">我的性別</label>
          <div className="grid grid-cols-2 gap-4">
            {GENDERS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setSelectedGender(id)}
                className={`p-4 rounded-lg flex flex-col items-center justify-center border-2 transition-colors ${selectedGender === id ? 'bg-violet-600/20 border-violet-600' : 'bg-gray-900 border-gray-600 hover:border-violet-600'}`}
              >
                <span className="text-3xl">{icon}</span>
                <span className="font-semibold mt-2">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white font-bold rounded-full hover:bg-gray-500 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-colors disabled:bg-gray-500"
          >
            {isSaving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
};
