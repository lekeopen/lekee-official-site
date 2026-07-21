import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom';
import ServerApp from './seo/ServerApp';

export function renderPath(pathname: string): string {
  return renderToString(
    <HelmetProvider>
      <StaticRouter location={pathname}>
        <ServerApp />
      </StaticRouter>
    </HelmetProvider>,
  );
}
