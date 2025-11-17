import React, { useState, useCallback } from 'react';
import { User, Target, TargetProfile, AssistantMode, AnalysisResponse, IntentResponse, Goal, TopicCategory, Tone } from '../types';
import { generateTopic, analyzeAndSuggestReply, analyzeIntent, translateWithCulturalContext } from '../services/geminiService';
import { updateTargetProfile } from '../services/userService';
import { GOALS, TOPIC_CATEGORIES, TONES } from '../constants';


const ProfileInput: React.FC<{ profile: TargetProfile; setProfile: React.Dispatch<React.SetStateAction<TargetProfile>> }> = ({ profile, setProfile }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const inputFieldClasses = "w-full p-3 bg-gray-900 rounded-lg border border-gray-600 focus:ring-2 focus:ring-violet-600 focus:border-violet-600 transition-colors duration-200 text-gray-50";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input name="nationality" value={profile.nationality} onChange={handleChange} placeholder="國籍 (選填)" className={inputFieldClasses} />
      <input name="age" value={profile.age} onChange={handleChange} placeholder="年齡 (選填)" className={inputFieldClasses} />
      <input name="education" value={profile.education} onChange={handleChange} placeholder="學歷 (選填)" className={inputFieldClasses} />
      <input name="job" value={profile.job} onChange={handleChange} placeholder="工作背景 (選填)" className={inputFieldClasses} />
      <input name="bodyType" value={profile.bodyType} onChange={handleChange} placeholder="身形 (選填)" className={inputFieldClasses} />
      <input name="religion" value={profile.religion} onChange={handleChange} placeholder="宗教 (選填)" className={inputFieldClasses} />
      <input name="diet" value={profile.diet} onChange={handleChange} placeholder="飲食習慣 (選填)" className={inputFieldClasses} />
      <input name="interests" value={profile.interests} onChange={handleChange} placeholder="興趣 (選填)" className={inputFieldClasses} />
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
  </div>
);

interface AssistantPageProps {
  user: User;
  target: Target;
  onBack: () => void;
}

const isProfileFilled = (p: TargetProfile) => Object.values(p).some(val => val.trim() !== '');

export const AssistantPage: React.FC<AssistantPageProps> = ({ user, target, onBack }) => {
  const [profile, setProfile] = useState<TargetProfile>(target.profile);
  const [isProfileExpanded, setIsProfileExpanded] = useState(!isProfileFilled(target.profile));
  const [conversation, setConversation] = useState('');
  const [goal, setGoal] = useState<Goal>(Goal.Friendship);
  const [tone, setTone] = useState<Tone>(Tone.Gentle);
  const [topicCategory, setTopicCategory] = useState<TopicCategory>(TopicCategory.Hobbies);
  const [mode, setMode] = useState<AssistantMode>(AssistantMode.GetReply);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string[] | AnalysisResponse | IntentResponse | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  const handleSaveProfile = () => {
    updateTargetProfile(target.id, profile);
    setIsProfileExpanded(false);
  };
  
  const handleGenerate = useCallback(async () => {
    if (!goal && mode !== AssistantMode.AnalyzeIntent) {
        setError('請先選擇這次的目標。');
        return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setTranslations({});
    setTranslating({});

    try {
      let response;
      const commonData = { userId: user.id, targetId: target.id, gender: user.gender, profile, mode };
      if (mode === AssistantMode.StartTopic) {
        response = await generateTopic({ ...commonData, goal, tone }, topicCategory);
      } else if (mode === AssistantMode.GetReply) {
        if (!conversation.trim()) {
            setError('請貼上對話內容。');
            setIsLoading(false);
            return;
        }
        response = await analyzeAndSuggestReply({ ...commonData, goal, tone, conversation });
      } else { // AnalyzeIntent
         if (!conversation.trim()) {
            setError('請貼上對話內容以分析意圖。');
            setIsLoading(false);
            return;
        }
        response = await analyzeIntent({ ...commonData, conversation }, user, target);
      }
      setResult(response);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [mode, user, target, goal, profile, conversation, topicCategory, tone]);
  
  const handleTranslate = async (text: string) => {
    if (!goal) return;
    setTranslating(prev => ({ ...prev, [text]: true }));
    setError(null);
    try {
        const translatedText = await translateWithCulturalContext(text, user.gender, goal, profile);
        setTranslations(prev => ({ ...prev, [text]: translatedText }));
    } catch (e: any) {
        setError(e.message || '翻譯失敗');
    } finally {
        setTranslating(prev => ({ ...prev, [text]: false }));
    }
};

  const handleCopy = (originalText: string) => {
    const textToCopy = translations[originalText] || originalText;
    navigator.clipboard.writeText(textToCopy);
  };

  const renderSuggestion = (suggestion: string, index: number) => (
    <div key={index} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <p className="text-gray-50 font-medium mb-3">{suggestion}</p>
      {translations[suggestion] && (
        <div className="p-3 mb-3 bg-gray-900/50 rounded-lg border-l-2 border-pink-600">
          <p className="text-gray-50 font-medium">{translations[suggestion]}</p>
        </div>
      )}
      <div className="flex items-center space-x-4">
        <button onClick={() => handleCopy(suggestion)} className="text-sm text-violet-600 hover:text-violet-700">複製</button>
        <button onClick={() => handleTranslate(suggestion)} disabled={translating[suggestion]} className="text-sm text-pink-600 hover:underline disabled:text-gray-500">
          {translating[suggestion] ? '翻譯中...' : '翻譯'}
        </button>
      </div>
    </div>
  );

  const renderResult = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <div className="p-4 bg-red-900/50 text-red-300 rounded-lg">{error}</div>;
    if (!result) return null;

    if (mode === AssistantMode.StartTopic && Array.isArray(result)) {
      return <div className="space-y-3">{result.map(renderSuggestion)}</div>;
    }

    if (mode === AssistantMode.GetReply && 'suggestions' in result) {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-violet-600">AI 情況分析</h4>
            <p className="p-4 bg-gray-900 rounded-lg border border-gray-700 text-gray-300">{result.analysis}</p>
          </div>
          <div>
            <h4 className="font-semibold text-pink-600">建議回覆</h4>
             <div className="space-y-3">{result.suggestions.map(renderSuggestion)}</div>
          </div>
        </div>
      );
    }
    
    if (mode === AssistantMode.AnalyzeIntent && 'intent' in result) {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-violet-600">對方意圖判定</h4>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 text-gray-50 font-bold text-lg">
                <span>{result.intent} </span>
                <span className="text-sm font-normal text-gray-300">(信心指數: {result.confidence}%)</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-pink-600">判斷依據</h4>
            <p className="p-4 bg-gray-900 rounded-lg border border-gray-700 text-gray-300">{result.reasoning}</p>
          </div>
        </div>
      );
    }

    return null;
  };
  
  const getButtonText = () => {
    switch(mode) {
        case AssistantMode.GetReply: return "分析並建議回覆";
        case AssistantMode.StartTopic: return "生成開場白";
        case AssistantMode.AnalyzeIntent: return "分析對方意圖";
    }
  }

  return (
    <div className="min-h-screen container mx-auto p-4 md:p-8 animate-fade-in">
      <button onClick={onBack} className="mb-4 text-sm text-violet-600 hover:underline">‹ 返回儀表板</button>
      <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl space-y-6">
        <h1 className="text-3xl font-bold text-center">與 <span className="text-violet-600">{target.name}</span> 的對話助理</h1>
        
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">1. 描述目標對象 (選填)</h2>
            {!isProfileExpanded && (
              <button onClick={() => setIsProfileExpanded(true)} className="text-sm text-violet-600 hover:underline">
                修改描述
              </button>
            )}
          </div>
          {isProfileExpanded ? (
            <>
              <p className="text-sm text-gray-300 my-4">資訊越詳細，AI 的建議越精準。</p>
              <ProfileInput profile={profile} setProfile={setProfile} />
              <div className="text-right mt-4">
                <button onClick={handleSaveProfile} className="px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700">
                  儲存描述
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-300 mt-2">目標對象描述已儲存。點擊「修改描述」來更新。</p>
          )}
        </div>

        <div>
           <h2 className="text-2xl font-bold mb-4">{mode === AssistantMode.AnalyzeIntent ? '2. 貼上對話' : '2. 設定情境'}</h2>
           <div className="flex space-x-2 border-b border-gray-700 mb-4">
               {Object.values(AssistantMode).map(m => (
                   <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${mode === m ? 'border-b-2 border-violet-600 text-violet-600' : 'text-gray-300 hover:text-gray-50'}`}>
                       {m === AssistantMode.GetReply && '取得回覆'}
                       {m === AssistantMode.StartTopic && '開啟話題'}
                       {m === AssistantMode.AnalyzeIntent && '分析意圖'}
                   </button>
               ))}
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mode !== AssistantMode.AnalyzeIntent && (
                  <div className="space-y-4">
                      <div>
                          <h3 className="text-lg font-semibold mb-2">這次的目標是？</h3>
                          <div className="grid grid-cols-3 gap-2">
                              {GOALS.map(g => (
                                  <button key={g.id} onClick={() => setGoal(g.id)} className={`p-2 rounded-lg text-center transition-all duration-200 border-2 ${goal === g.id ? 'bg-violet-600 border-violet-700' : 'bg-gray-900 border-gray-600 hover:border-violet-600'}`}>
                                     <span className="text-xl">{g.icon}</span>
                                     <p className="font-semibold text-xs">{g.label}</p>
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">選擇語氣</h3>
                         <div className="grid grid-cols-3 gap-2">
                            {TONES.map(t => (
                                <button key={t.id} onClick={() => setTone(t.id)} className={`p-2 rounded-lg text-center transition-all duration-200 border-2 ${tone === t.id ? 'bg-pink-600 border-pink-700' : 'bg-gray-900 border-gray-600 hover:border-pink-600'}`}>
                                    <p className="font-semibold text-sm">{t.label}</p>
                                </button>
                            ))}
                         </div>
                      </div>
                  </div>
                )}

                {mode === AssistantMode.StartTopic ? (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">選擇話題類型</h3>
                        <select 
                            value={topicCategory} 
                            onChange={(e) => setTopicCategory(e.target.value as TopicCategory)}
                            className="w-full p-3 bg-gray-900 rounded-lg border border-gray-600 focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                        >
                            {TOPIC_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className={mode === AssistantMode.AnalyzeIntent ? 'md:col-span-2' : ''}>
                        <h3 className="text-lg font-semibold mb-2">貼上對話內容</h3>
                        <textarea 
                            value={conversation}
                            onChange={(e) => setConversation(e.target.value)}
                            placeholder="將你與對方的對話紀錄貼在這裡..."
                            className="w-full h-40 p-3 bg-gray-900 rounded-lg border border-gray-600 focus:ring-2 focus:ring-violet-600 focus:border-violet-600 transition-colors duration-200"
                        />
                    </div>
                )}
            </div>
        </div>
        
        <div className="text-center">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-8 py-3 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-lg shadow-violet-600/30 disabled:bg-gray-500 disabled:cursor-not-allowed w-full md:w-auto"
            >
              {isLoading ? '生成中...' : getButtonText()}
            </button>
        </div>

        { (isLoading || error || result) &&
          <div className="pt-6 border-t border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-center">AI 神回覆</h2>
              {renderResult()}
          </div>
        }
      </div>
      <div className="text-center mt-8">
        <button onClick={onBack} className="px-6 py-2 bg-gray-800 text-gray-300 rounded-full hover:bg-gray-600 transition-colors">回到儀表板</button>
      </div>
    </div>
  );
};
