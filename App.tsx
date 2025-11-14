import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AboutPage } from './components/AboutPage';
import { PrivacyPage } from './components/PrivacyPage';
import { DashboardPage } from './components/DashboardPage';
import { AdminPage } from './components/AdminPage';
import { AssistantPage } from './components/AssistantPage';
import { ProfileModal } from './components/ProfileModal';
import { User, Target } from './types';
import { getCurrentUser, logoutUser } from './services/userService';

type Page = 'home' | 'login' | 'register' | 'about' | 'privacy' | 'dashboard' | 'admin' | 'assistant';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setPage(user.isAdmin ? 'admin' : 'dashboard');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setPage(user.isAdmin ? 'admin' : 'dashboard');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setPage('home');
  };

  const handleUpdateUser = (updatedUser: User) => {
      setCurrentUser(updatedUser);
  }

  const navigate = (newPage: Page) => {
    setPage(newPage);
  };
  
  const startAssistant = (target: Target) => {
      setSelectedTarget(target);
      setPage('assistant');
  }

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onRegister={handleLogin} onNavigate={navigate} />;
      case 'about':
        return <AboutPage onBack={() => navigate('home')} />;
      case 'privacy':
        return <PrivacyPage onBack={() => navigate('home')} />;
      case 'dashboard':
        if (currentUser) {
            return <DashboardPage 
                        user={currentUser} 
                        onStartAssistant={startAssistant} 
                        onLogout={handleLogout} 
                        onShowProfile={() => setShowProfileModal(true)}
                    />;
        }
        break;
      case 'admin':
         if (currentUser && currentUser.isAdmin) {
            return <AdminPage onLogout={handleLogout} />;
         }
         break;
      case 'assistant':
        if (currentUser && selectedTarget) {
            return <AssistantPage user={currentUser} target={selectedTarget} onBack={() => navigate(currentUser.isAdmin ? 'admin' : 'dashboard')} />;
        }
        break;
    }
    // Fallback
    logoutUser();
    return <HomePage onNavigate={navigate} />;
  };

  return (
    <main>
      {renderPage()}
      {showProfileModal && currentUser && (
        <ProfileModal 
            user={currentUser} 
            onClose={() => setShowProfileModal(false)}
            onSave={handleUpdateUser}
        />
      )}
    </main>
  );
};

export default App;