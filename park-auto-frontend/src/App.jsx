import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import UtilisateursView from './components/UtilisateursView';
import AuditView from './components/AuditView';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!user) {
    return <LoginView onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9]">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'vehicules' && <DashboardView />}
        {activeView === 'utilisateurs' && <UtilisateursView />}
        {activeView === 'audit' && <AuditView />}
      </div>
    </div>
  );
}
