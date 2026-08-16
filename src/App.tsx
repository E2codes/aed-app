import React, { useState, useEffect } from 'react';
import supabase from './supabase';
import AEDAppHome from './AEDAppHome';
import AEDInspectionForm from './AEDInspectionForm';
import Login from './Login';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [prefillData, setPrefillData] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      setCurrentPage(e.detail);
      // Clear prefill when navigating to home
      if (e.detail === 'home') {
        setPrefillData({});
      }
    };
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

  if (authLoading) {
    return (
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#b5b5b7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#3d3d3a', fontWeight: '600', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

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
          prefill={Object.keys(prefillData).length > 0 ? prefillData : undefined}
          user={user}
          onSubmit={() => { setCurrentPage('home'); setPrefillData({}); }}
        />
      </div>
    );
  }

  return <AEDAppHome user={user} onLogout={handleLogout} />;
}

export default App;
