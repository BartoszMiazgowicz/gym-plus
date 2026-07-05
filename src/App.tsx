import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, Suspense, lazy } from 'react';
import { getUser } from './data/store';
import { useAuth } from './contexts/useAuth';
import { useSync } from './hooks/useSync';
import BottomNav from './components/BottomNav';
import LoadingScreen from './components/LoadingScreen';
import Onboarding from './pages/Onboarding';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorkoutHome = lazy(() => import('./pages/workout/WorkoutHome'));
const ActiveWorkout = lazy(() => import('./pages/workout/ActiveWorkout'));
const ExerciseBrowser = lazy(() => import('./pages/workout/ExerciseBrowser'));
const Templates = lazy(() => import('./pages/workout/Templates'));
const History = lazy(() => import('./pages/workout/History'));
const PRStats = lazy(() => import('./pages/workout/PRStats'));
const Badges = lazy(() => import('./pages/workout/Badges'));
const WorkoutDetail = lazy(() => import('./pages/workout/WorkoutDetail'));
const TemplateEditor = lazy(() => import('./pages/workout/TemplateEditor'));
const HIITTimer = lazy(() => import('./pages/workout/HIITTimer'));
const StrengthCalculator = lazy(() => import('./pages/workout/StrengthCalculator'));
const MuscleMap = lazy(() => import('./pages/workout/MuscleMap'));
const WorkoutCalendar = lazy(() => import('./pages/workout/WorkoutCalendar'));
const ExerciseDetail = lazy(() => import('./pages/workout/ExerciseDetail'));
const DietJournal = lazy(() => import('./pages/diet/DietJournal'));
const FoodSearch = lazy(() => import('./pages/diet/FoodSearch'));
const Recipes = lazy(() => import('./pages/diet/Recipes'));
const WeightTracker = lazy(() => import('./pages/diet/WeightTracker'));
const CalorieGoals = lazy(() => import('./pages/diet/CalorieGoals'));
const DietBadges = lazy(() => import('./pages/diet/DietBadges'));
const Profile = lazy(() => import('./pages/Profile'));
const Physique = lazy(() => import('./pages/Physique'));
const WeightPlan = lazy(() => import('./pages/WeightPlan'));
const Settings = lazy(() => import('./pages/Settings'));
const FeedbackAdmin = lazy(() => import('./pages/FeedbackAdmin'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

function RouteFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="animate-pulse" style={{ font: 'var(--body)', color: 'var(--text-secondary)' }}>Ładowanie...</div>
    </div>
  );
}

function App() {
  const { user: authUser, isLoading } = useAuth();
  const { initialLoading: isSyncing } = useSync(authUser?.id);
  const [user, setUser] = useState(getUser());
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    const handleStoreChange = () => {
      setUser(getUser());
      refresh();
    };
    window.addEventListener('gymplus_store_changed', handleStoreChange);
    return () => window.removeEventListener('gymplus_store_changed', handleStoreChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', user.theme);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', user.theme === 'light' ? '#F5F5F7' : '#000000');
  }, [user.theme]);

  // Show loading while auth is resolving or sync is downloading data from cloud.
  // Also wait if the local user.id doesn't match authUser.id — that means
  // clearAllData wiped localStorage and sync hasn't restored it yet.
  const waitingForSync = !!authUser && (isSyncing || user.id !== authUser.id);

  if (isLoading || waitingForSync) {
    return <LoadingScreen />;
  }

  if (!authUser) {
    return (
      <BrowserRouter>
        <div className="app-container app-container--auth">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    );
  }

  if (!user.onboarding_completed) {
    return <Onboarding onComplete={(u) => { setUser(u); }} />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard key={refreshKey} onRefresh={refresh} />} />
            <Route path="/workout" element={<WorkoutHome />} />
            <Route path="/workout/active" element={<ActiveWorkout onRefresh={refresh} />} />
            <Route path="/workout/exercises" element={<ExerciseBrowser />} />
            <Route path="/workout/templates" element={<Templates />} />
            <Route path="/workout/templates/:id" element={<TemplateEditor />} />
            <Route path="/workout/history" element={<History />} />
            <Route path="/workout/detail/:id" element={<WorkoutDetail />} />
            <Route path="/workout/pr" element={<PRStats />} />
            <Route path="/workout/badges" element={<Badges />} />
            <Route path="/workout/timer" element={<HIITTimer />} />
            <Route path="/workout/calculator" element={<StrengthCalculator />} />
            <Route path="/workout/muscles" element={<MuscleMap />} />
            <Route path="/workout/calendar" element={<WorkoutCalendar />} />
            <Route path="/workout/exercise/:id" element={<ExerciseDetail />} />
            <Route path="/diet" element={<DietJournal key={refreshKey} onRefresh={refresh} />} />
            <Route path="/diet/search" element={<FoodSearch onRefresh={refresh} />} />
            <Route path="/diet/recipes" element={<Recipes />} />
            <Route path="/diet/weight" element={<WeightTracker />} />
            <Route path="/diet/goals" element={<CalorieGoals />} />
            <Route path="/diet/badges" element={<DietBadges />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/physique" element={<Physique />} />
            <Route path="/weight-plan" element={<WeightPlan />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/feedback" element={<FeedbackAdmin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
