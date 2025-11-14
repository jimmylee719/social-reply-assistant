import React, { useState } from 'react';
import { User, Gender } from '../types';
import { registerUser } from '../services/userService';
import { GENDERS } from '../constants';

interface RegisterPageProps {
  onRegister: (user: User) => void;
  onNavigate: (page: 'login' | 'home') => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !confirmPassword || !gender) {
      setError('請填寫所有欄位。');
      return;
    }
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致。');
      return;
    }
    const newUser = registerUser(email, password, gender);
    if (newUser) {
      onRegister(newUser);
    } else {
      setError('此電子郵件已被註冊。');
    }
  };
  
  const inputFieldClasses = "w-full p-3 bg-surface rounded-lg border border-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <button onClick={() => onNavigate('home')} className="absolute top-4 left-4 text-sm text-primary hover:underline">‹ 返回首頁</button>
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">註冊帳號</h1>
        <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-2xl shadow-2xl space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary">電子郵件</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputFieldClasses} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary">密碼</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputFieldClasses} placeholder="••••••••" />
          </div>
           <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary">確認密碼</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputFieldClasses} placeholder="••••••••" />
          </div>
          <div>
             <label className="block mb-2 text-sm font-medium text-text-secondary">我是</label>
             <div className="grid grid-cols-2 gap-4">
                {GENDERS.map(({id, label, icon}) => (
                    <button type="button" key={id} onClick={() => setGender(id)} className={`p-4 rounded-lg flex flex-col items-center justify-center border-2 transition-colors ${gender === id ? 'bg-primary/20 border-primary' : 'bg-background border-gray-600 hover:border-primary'}`}>
                        <span className="text-3xl">{icon}</span>
                        <span className="font-semibold mt-2">{label}</span>
                    </button>
                ))}
             </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-focus transition-all duration-300 shadow-lg shadow-primary/30">
            註冊
          </button>
           <p className="text-center text-sm text-text-secondary">
            已經有帳號？ <button type="button" onClick={() => onNavigate('login')} className="font-medium text-primary hover:underline">前往登入</button>
          </p>
        </form>
      </div>
    </div>
  );
};
