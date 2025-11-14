import React from 'react';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-text-secondary">
        <button onClick={onBack} className="absolute top-4 left-4 text-sm text-primary hover:underline">‹ 返回首頁</button>
       <div className="max-w-3xl bg-surface p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-text-primary mb-4">隱私權政策</h1>
            <p className="mb-4">
                我們非常重視您的隱私。本應用程式的設計核心原則之一，就是最大限度地保護您的個人資訊與對話內容。
            </p>
            <h2 className="text-xl font-semibold text-text-primary mb-2">資料儲存</h2>
            <p className="mb-4">
                本系統的所有資料，包括您的帳號資訊、目標對象描述以及互動歷史，皆儲存在您個人裝置的瀏覽器本機儲存空間 (Local Storage) 中。我們<span className="font-bold text-primary">不會</span>將您的任何個人資料或對話內容上傳或儲存到我們的伺服器。這意味著您的資料完全由您自己掌控。
            </p>
            <h2 className="text-xl font-semibold text-text-primary mb-2">AI 互動</h2>
            <p className="mb-4">
                當您請求 AI 生成建議時，只有當下您所提供的文字內容（例如對話紀錄、目標描述）會被傳送至 Google Gemini API 進行分析。這些請求是獨立的，API 不會儲存您的個人身份資訊。您的資料可能被用於 AI 模型的訓練，但會經過匿名化處理，以符合 Google 的隱私權政策。
            </p>
            <h2 className="text-xl font-semibold text-text-primary mb-2">第三方共享</h2>
            <p className="mb-4">
                我們承諾，絕不會將您的任何資料出售、交換或以任何形式轉移給任何第三方。
            </p>
             <div className="text-center mt-6">
                <button onClick={onBack} className="px-6 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary-focus transition-colors">
                    我明白了
                </button>
            </div>
       </div>
    </div>
  );
};
