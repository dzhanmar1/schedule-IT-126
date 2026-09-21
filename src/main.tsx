/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './i18n';
import { ThemeProvider } from './contexts/ThemeContext';
import { TimeProvider } from './contexts/TimeContext';
import App from './App.tsx';
import './index.css';

import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { UpdateBannerWrapper } from './components/UpdateBanner';

// ── PWA Update Banner ─────────────────────────────────────────────────────────
// We mount the banner into a separate div so it sits above the app tree and
// doesn't require any context (theme / language / auth).

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;
let bannerRoot: ReturnType<typeof createRoot> | null = null;

function renderBanner(visible: boolean) {
  if (!bannerRoot) {
    const el = document.createElement('div');
    el.id = 'pwa-update-root';
    document.body.appendChild(el);
    bannerRoot = createRoot(el);
  }

  bannerRoot.render(
    <UpdateBannerWrapper
      isVisible={visible}
      onUpdate={() => updateSW?.(true)}
      onDismiss={() => renderBanner(false)}
    />
  );
}

updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    renderBanner(true);
  },
  onOfflineReady() {
    console.info('[PWA] App is ready to work offline.');
  },
});
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <TimeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </TimeProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
