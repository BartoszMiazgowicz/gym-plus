import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getUser } from './data/store';
import { useAuth } from './contexts/AuthContext';
import { useSync } from './hooks/useSync';
import BottomNav from './components/BottomNav';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './pages/Dashboard';
import WorkoutHome from './pages/workout/WorkoutHome';
import ActiveWorkout from './pages/workout/ActiveWorkout';
import ExerciseBrowser from './pages/workout/ExerciseBrowser';
import Templates from './pages/workout/Templates';
import History from './pages/workout/History';
import PRStats from './pages/workout/PRStats';
import Badges from './pages/workout/Badges';
import WorkoutDetail from './pages/workout/WorkoutDetail';
import TemplateEditor from './pages/workout/TemplateEditor';
import HIITTimer from './pages/workout/HIITTimer';
import StrengthCalculator from './pages/workout/StrengthCalculator';
import MuscleMap from './pages/workout/MuscleMap';
import WorkoutCalendar from './pages/workout/WorkoutCalendar';
import ExerciseDetail from './pages/workout/ExerciseDetail';
import DietJournal from './pages/diet/DietJournal';
import FoodSearch from './pages/diet/FoodSearch';
import Recipes from './pages/diet/Recipes';
import WeightTracker from './pages/diet/WeightTracker';
import CalorieGoals from './pages/diet/CalorieGoals';
import DietBadges from './pages/diet/DietBadges';
import Profile from './pages/Profile';
import Physique from './pages/Physique';
import WeightPlan from './pages/WeightPlan';
import Settings from './pages/Settings';
import FeedbackAdmin from './pages/FeedbackAdmin';
import Onboarding from './pages/Onboarding';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
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
        <Routes>
          <Route path="/" element={<Dashboard key={refreshKey} onRefresh={refresh} />} />
          <Route path="/workout" element={<WorkoutHome onRefresh={refresh} />} />
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
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
