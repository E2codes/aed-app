import React, { useState, useEffect } from 'react';
import AEDAppHome from './AEDAppHome';
import supabase from './supabase';
import AEDInspectionForm from './AEDInspectionForm';
import Login from './Login';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [prefillData, setPrefillData] = useState({});
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleNavigate = (e: any) => setCurrentPage(e.detail);
    const handlePrefill = (e: any) => setPrefillData(e.detail);
    window.addEventListener('navigate', handleNavigate);
    window.addEventListener('prefill', handlePrefill);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
      window.removeEventListener('prefill', handlePrefill);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('home');
    setPrefillData({});
  };

  // Still checking auth
  if (authLoading) {
    return (
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#b5b5b7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#3d3d3a', fontWeight: '600', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  // Not logged in — show login screen
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Logged in — show inspection form
  if (currentPage === 'inspection') {
    return (
      <div>
        <button
          onClick={() => { setCurrentPage('home'); setPrefillData({}); }}
          style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 1000, padding: '10px 16px', backgroundColor: '#5d8b5f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
        >
          Back
        </button>
        <AEDInspectionForm
          prefill={prefillData}
          user={user}
          onSubmit={() => { setCurrentPage('home'); setPrefillData({}); }}
        />
      </div>
    );
  }

  // Logged in — show home
  return <AEDAppHome user={user} onLogout={handleLogout} />;
}

export default App;
