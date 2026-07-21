import React from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import Services from '../pages/Services';
import Products from '../pages/Products';
import Solutions from '../pages/Solutions';
import About from '../pages/About';
import Contact from '../pages/Contact';
import News from '../pages/News';
import NewsDetail from '../pages/NewsDetail';
import ProjectDetail from '../pages/ProjectDetail';
import Privacy from '../pages/Privacy';

export default function ServerApp() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="products" element={<Products />} />
        <Route path="solutions" element={<Solutions />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="news" element={<News />} />
        <Route path="news/:id" element={<NewsDetail />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="privacy" element={<Privacy />} />
      </Route>
    </Routes>
  );
}
