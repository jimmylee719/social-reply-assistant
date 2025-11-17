import React, { useState } from 'react';
import { User } from '../types';
import { loginUser } from '../services/userService';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onNavigate: (page: 'register' | 'home') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('請輸入電子郵件和密碼。');
      return;
    }
    const user = loginUser(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('電子郵件或密碼錯誤。');
    }
  };

  const inputFieldClasses = "w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:ring-2 focus:ring-violet-600 focus:border-violet-600 transition-colors duration-200";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <button onClick={() => onNavigate('home')} className="absolute top-4 left-4 text-sm text-violet-600 hover:underline">‹ 返回首頁</button>
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">登入</h1>
        <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-2xl shadow-2xl space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">電子郵件</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputFieldClasses} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">密碼</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputFieldClasses} placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full px-6 py-3 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-lg shadow-violet-600/30">
            登入
          </button>
          <p className="text-center text-sm text-gray-300">
            還沒有帳號？ <button type="button" onClick={() => onNavigate('register')} className="font-medium text-violet-600 hover:underline">立即註冊</button>
          </p>
        </form>
      </div>
    </div>
  );
};
