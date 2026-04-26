import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Friends from './pages/Friends';
import AdminLanding from './pages/AdminLanding';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import StudentDataPrivacy from './pages/StudentDataPrivacy';
import SecurityTrustCenter from './pages/SecurityTrustCenter';
import PilotResults from './pages/PilotResults';
import CMSCompliance from './pages/CMSCompliance';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Friends" element={
        <LayoutWrapper currentPageName="Friends">
          <Friends />
        </LayoutWrapper>
      } />
      <Route path="/for-admins" element={
        <LayoutWrapper currentPageName="AdminLanding">
          <AdminLanding />
        </LayoutWrapper>
      } />
      <Route path="/privacy" element={
        <LayoutWrapper currentPageName="PrivacyPolicy">
          <PrivacyPolicy />
        </LayoutWrapper>
      } />
      <Route path="/terms" element={
        <LayoutWrapper currentPageName="TermsOfUse">
          <TermsOfUse />
        </LayoutWrapper>
      } />
      <Route path="/student-data-privacy" element={
        <LayoutWrapper currentPageName="StudentDataPrivacy">
          <StudentDataPrivacy />
        </LayoutWrapper>
      } />
      <Route path="/security" element={
        <LayoutWrapper currentPageName="SecurityTrustCenter">
          <SecurityTrustCenter />
        </LayoutWrapper>
      } />
      <Route path="/pilot-results" element={
        <LayoutWrapper currentPageName="PilotResults">
          <PilotResults />
        </LayoutWrapper>
      } />
      <Route path="/cms-compliance" element={
        <LayoutWrapper currentPageName="CMSCompliance">
          <CMSCompliance />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App