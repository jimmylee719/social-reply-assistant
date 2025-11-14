import React from 'react';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-text-secondary">
       <button onClick={onBack} className="absolute top-4 left-4 text-sm text-primary hover:underline">‹ 返回首頁</button>
       <div className="max-w-3xl bg-surface p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-text-primary mb-4">關於 Social Reply Assistant</h1>
            <p className="mb-4">
                在現今快節奏的社交環境中，我們都曾遇到過詞窮、不知如何開啟或延續對話的窘境。Social Reply Assistant 的誕生，正是為了解決這個問題。
            </p>
            <p className="mb-4">
                本應用程式利用最先進的 AI 技術，結合了社會心理學、溝通理論以及大量成功的對話模型，為您提供在各種社交情境下的最佳回覆建議。無論您是想結交新朋友、尋找認真交往的對象，或是希望在對話中增添一絲曖昧的火花，我們的 AI 都能成為您最強大的後盾。
            </p>
             <p className="mb-4">
                我們的使命是幫助您建立更有意義的連結，讓每一次的對話都充滿自信與魅力。
            </p>
            <div className="text-center mt-6">
                <button onClick={onBack} className="px-6 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary-focus transition-colors">
                    開始使用
                </button>
            </div>
       </div>
    </div>
  );
};
