import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './styles/tokens.css';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import ProgressScreen from './screens/ProgressScreen';
import ProfileScreen from './screens/ProfileScreen';
import { useMobileData } from './lib/useMobileData';

export default function MobileApp() {
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState('home');
  const [hero, setHero] = useState(null);
  const [prUnlock, setPrUnlock] = useState(null); // palette key when a PR fires

  const userId = session?.user?.id;
  const data = useMobileData(userId);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login');
    }
  }, [authLoading, session, navigate]);

  // Load hero from profile (authoritative) then localStorage (fallback)
  useEffect(() => {
    if (profile?.hero_archetype) {
      setHero(profile.hero_archetype);
    } else {
      const saved = localStorage.getItem('pk_hero');
      if (saved) setHero(saved);
    }
  }, [profile]);

  useEffect(() => {
    document.body.style.background = '#080809';
    document.body.style.margin = '0';
    return () => { document.body.style.background = ''; document.body.style.margin = ''; };
  }, []);

  async function completeOnboarding(chosen) {
    localStorage.setItem('pk_hero', chosen);
    setHero(chosen);
    if (userId) {
      await supabase.from('profiles').update({
        hero_archetype: chosen,
        hero_xp: 0,
      }).eq('id', userId);
    }
    setScreen('home');
  }

  function handlePR(paletteKey) {
    setPrUnlock(paletteKey);
  }

  if (authLoading || data.loading) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#080809',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace', fontSize: 12,
        letterSpacing: '0.12em', color: '#39ff8a',
      }}>
        LOADING...
      </div>
    );
  }

  if (!session) return null; // navigating to /login

  if (!hero) {
    return <OnboardingScreen onComplete={completeOnboarding}/>;
  }

  const props = {
    hero, setHero,
    navigate: setScreen,
    data,
    userId,
    onPR: handlePR,
    profile,
  };

  return (
    <>
      {prUnlock && (
        <PRMoment palette={prUnlock} hero={hero} onDismiss={() => setPrUnlock(null)}/>
      )}
      {screen === 'home'     && <HomeScreen     {...props}/>}
      {screen === 'workout'  && <WorkoutScreen  {...props}/>}
      {screen === 'progress' && <ProgressScreen {...props}/>}
      {screen === 'profile'  && <ProfileScreen  {...props}/>}
    </>
  );
}

const PALETTE_COLORS = {
  crimson:  '#dc2626',
  jade:     '#10b981',
  frost:    '#67e8f9',
  obsidian: '#6366f1',
  gold:     '#f59e0b',
};

function PRMoment({ palette, hero, onDismiss }) {
  const color = PALETTE_COLORS[palette] || '#39ff8a';
  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: 32,
        cursor: 'pointer',
      }}
    >
      <div style={{
        fontFamily: 'var(--pk-font-mono)', fontSize: 13,
        letterSpacing: '0.18em', color: 'var(--pk-muted)',
      }}>PERSONAL RECORD</div>

      <div style={{
        fontSize: 72, lineHeight: 1,
        filter: `drop-shadow(0 0 24px ${color})`,
      }}>★</div>

      <div style={{
        fontFamily: 'var(--pk-font-display)',
        fontSize: 36, fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '-0.01em',
        color, textAlign: 'center',
        textShadow: `0 0 40px ${color}80`,
      }}>
        {palette.toUpperCase()}<br/>UNLOCKED
      </div>

      <div style={{
        width: 64, height: 64,
        background: color,
        borderRadius: 8,
        boxShadow: `0 0 40px ${color}60`,
      }}/>

      <div style={{
        fontFamily: 'var(--pk-font-body)', fontSize: 14,
        color: 'var(--pk-text-2)', textAlign: 'center', lineHeight: 1.5,
        maxWidth: '28ch',
      }}>
        New palette added to your hero. Switch it in the HERO tab.
      </div>

      <div style={{
        fontFamily: 'var(--pk-font-mono)', fontSize: 11,
        color: 'var(--pk-muted)', letterSpacing: '0.1em',
        marginTop: 8,
      }}>TAP TO CONTINUE</div>
    </div>
  );
}
