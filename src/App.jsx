import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './Layout';
import HarmonyResonance from './pages/HarmonyResonance';
import LearningHome from './pages/LearningHome';
import DimensionScenarios from './pages/DimensionScenarios';
import ScenarioDetail from './pages/ScenarioDetail';
import JourneyView from './pages/JourneyView';
import JourneyReflection from './pages/JourneyReflection';
import LearningArchive from './pages/LearningArchive';
import Login from './pages/Login';
import MeditationHome from './pages/MeditationHome';
import MeditationDimension from './pages/MeditationDimension';
import MeditationSubtask from './pages/MeditationSubtask';
import MeditationCombinations from './pages/MeditationCombinations';
import MeditationCombination from './pages/MeditationCombination';
import HarvestView from './pages/HarvestView';
import Profile from './pages/Profile';
import Sleep from './pages/Sleep';
import TaoWeight from './pages/TaoWeight';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/learning" replace />} />
            {/* Learning routes: static routes before dynamic :dimensionSlug */}
            <Route path="learning" element={<LearningHome />} />
            <Route path="learning/scenario/:scenarioSlug" element={<ScenarioDetail />} />
            <Route path="learning/journey/:journeyId/reflection" element={<JourneyReflection />} />
            <Route path="learning/journey/:journeyId" element={<JourneyView />} />
            <Route path="learning/archive" element={<LearningArchive />} />
            <Route path="learning/:dimensionSlug" element={<DimensionScenarios />} />
            <Route path="meditate" element={<MeditationHome />} />
            <Route path="meditate/dimension/:slug" element={<MeditationDimension />} />
            <Route path="meditate/subtask/:id" element={<MeditationSubtask />} />
            <Route path="meditate/combinations" element={<MeditationCombinations />} />
            <Route path="meditate/combination/:id" element={<MeditationCombination />} />
            <Route path="meditate/harvest/:tier" element={<HarvestView />} />
            <Route path="sleep" element={<Sleep />} />
            <Route path="tao-weight" element={<TaoWeight />} />
            <Route path="harmony-resonance" element={<HarmonyResonance />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
