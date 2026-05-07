import { useState, useEffect } from 'react';
import './styles/tokens.css';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import ProgressScreen from './screens/ProgressScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function MobileApp() {
  const [hero, setHero] = useState(() => localStorage.getItem('pk_hero') || null);
  const [screen, setScreen] = useState('home');

  useEffect(() => {
    document.body.style.background = '#080809';
    document.body.style.margin = '0';
    return () => { document.body.style.background = ''; document.body.style.margin = ''; };
  }, []);

  function completeOnboarding(chosen) {
    localStorage.setItem('pk_hero', chosen);
    setHero(chosen);
    setScreen('home');
  }

  if (!hero) {
    return <OnboardingScreen onComplete={completeOnboarding}/>;
  }

  const props = { hero, setHero, navigate: setScreen };

  return (
    <>
      {screen === 'home'     && <HomeScreen     {...props}/>}
      {screen === 'workout'  && <WorkoutScreen  {...props}/>}
      {screen === 'progress' && <ProgressScreen {...props}/>}
      {screen === 'profile'  && <ProfileScreen  {...props}/>}
    </>
  );
}
