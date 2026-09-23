/**
 * Demo App Router
 * Quick access to view all redesigned pages
 * Replace App.tsx temporarily with this to see demos
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Demo Landing
import DemoPage from './pages/DemoPage';

// New Redesigned Pages
import WelcomeScreen from './pages/student/WelcomeScreen';
import PronunciationPractice from './pages/student/PronunciationPractice';
import StudentDashboardRedesign from './pages/student/StudentDashboardRedesign';
import TakeAssessmentRedesign from './pages/student/TakeAssessmentRedesign';

function AppDemo() {
  return (
    <Routes>
      {/* Demo Home - List of all demos */}
      <Route path="/" element={<DemoPage />} />
      <Route path="/demo" element={<DemoPage />} />
      
      {/* Demo Routes - New Redesigned Pages */}
      <Route path="/demo/welcome" element={<WelcomeScreen />} />
      <Route path="/demo/pronunciation" element={<PronunciationPractice />} />
      <Route path="/demo/dashboard" element={<StudentDashboardRedesign />} />
      <Route path="/demo/assessment" element={<TakeAssessmentRedesign />} />
      
      {/* Redirect any unknown route to demo home */}
      <Route path="*" element={<Navigate to="/demo" replace />} />
    </Routes>
  );
}

export default AppDemo;
