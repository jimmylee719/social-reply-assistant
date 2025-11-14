
import React from 'react';
import { GENDERS, GOALS } from '../constants';
import { Gender, Goal } from '../types';

interface GoalPageProps {
  onGoalSelect: (gender: Gender, goal: Goal) => void;
}

export const GoalPage: React.FC<GoalPageProps> = ({ onGoalSelect }) => {
  const [selectedGender, setSelectedGender] = React.useState<Gender | null>(null);

  const handleGenderSelect = (gender: Gender) => {
    setSelectedGender(gender);
  };

  const handleGoalSelect = (goal: Goal) => {
    if (selectedGender) {
      onGoalSelect(selectedGender, goal);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in">
      {!selectedGender ? (
        <>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">首先，你是...</h1>
          <p className="text-text-secondary mb-8">選擇你的身份，以獲得更個人化的建議。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GENDERS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => handleGenderSelect(id)}
                className="p-8 bg-surface rounded-xl shadow-lg hover:shadow-primary/50 border border-transparent hover:border-primary transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-6xl mb-4">{icon}</div>
                <div className="text-2xl font-semibold">{label}</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">這次的目標是？</h1>
          <p className="text-text-secondary mb-8">告訴我你希望達成的關係，我會為你指引方向。</p>
          <div className="w-full max-w-2xl space-y-4">
            {GOALS.map(({ id, label, description, icon }) => (
              <button
                key={id}
                onClick={() => handleGoalSelect(id)}
                className="w-full flex items-center p-4 bg-surface rounded-lg shadow-md hover:shadow-primary/50 border border-transparent hover:border-primary transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-4xl mr-4">{icon}</div>
                <div className="text-left">
                  <div className="text-lg font-bold text-text-primary">{label}</div>
                  <div className="text-sm text-text-secondary">{description}</div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedGender(null)}
            className="mt-8 text-sm text-primary hover:underline"
          >
            返回選擇身份
          </button>
        </>
      )}
    </div>
  );
};
