import React from 'react';

interface HomePageProps {
  onNavigate: (page: 'login' | 'register' | 'about' | 'privacy') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-4 text-center">
      <div/>
      <div className="max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-4 animate-fade-in-down">
          Social Reply Assistant
        </h1>
        <p className="text-lg md:text-xl text-text-secondary mb-8 animate-fade-in-up">
          不再詞窮，不再尷尬。你的 AI 情感軍師，為你打造完美對話，輕鬆達成你的社交目標。
        </p>
        <div className="space-y-4 max-w-xl mx-auto mb-10 text-left text-text-secondary animate-fade-in">
          <div className="flex items-start space-x-3 p-3 rounded-lg">
            <span className="text-2xl mt-1">🎯</span>
            <div>
              <h3 className="font-semibold text-text-primary">選擇目標</h3>
              <p>從純交友到尋找伴侶，明確你的社交意圖。</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 rounded-lg">
            <span className="text-2xl mt-1">✍️</span>
            <div>
              <h3 className="font-semibold text-text-primary">提供情境</h3>
              <p>貼上對話或描述對象，讓 AI 深入了解狀況。</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 rounded-lg">
            <span className="text-2xl mt-1">💡</span>
            <div>
              <h3 className="font-semibold text-text-primary">獲得神回</h3>
              <p>AI 生成最佳開場白、回覆建議，或分析對方意圖。</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary-focus transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/30"
            >
              免費註冊
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 bg-surface text-text-primary font-bold rounded-full hover:bg-gray-600 transition-colors duration-300"
            >
              登入
            </button>
        </div>
      </div>
      <footer className="text-center text-text-secondary text-sm p-4">
        <button onClick={() => onNavigate('about')} className="hover:text-primary transition-colors">關於我們</button>
        <span className="mx-2">|</span>
        <button onClick={() => onNavigate('privacy')} className="hover:text-primary transition-colors">隱私權政策</button>
      </footer>
    </div>
  );
};
