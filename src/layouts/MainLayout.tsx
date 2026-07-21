import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50">
        <Suspense
          fallback={(
            <div
              className="min-h-[40vh] flex items-center justify-center text-sm text-gray-500"
              role="status"
            >
              页面加载中…
            </div>
          )}
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
