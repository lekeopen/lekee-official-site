import React, { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const Products = lazy(() => import('./pages/Products'));
const Solutions = lazy(() => import('./pages/Solutions'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const News = lazy(() => import('./pages/News'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Privacy = lazy(() => import('./pages/Privacy'));
const LekePickerProduct = lazy(() => import('./pages/LekePickerProduct'));
const GuigeleiProduct = lazy(() => import('./pages/GuigeleiProduct'));

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="products" element={<Products />} />
          <Route path="products/leke-picker" element={<LekePickerProduct />} />
          <Route path="products/guigelei" element={<GuigeleiProduct />} />
          <Route path="solutions" element={<Solutions />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="news" element={<News />} />
          <Route path="news/:id" element={<NewsDetail />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="privacy" element={<Privacy />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
