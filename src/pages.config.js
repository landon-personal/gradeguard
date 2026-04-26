/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Achievements from './pages/Achievements';
import AdminDashboard from './pages/AdminDashboard';
import Assignments from './pages/Assignments';
import ChromeExtension from './pages/ChromeExtension';
import Dashboard from './pages/Dashboard';
import Friends from './pages/Friends';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import StudyAssistant from './pages/StudyAssistant';
import StudyRooms from './pages/StudyRooms';
import Tests from './pages/Tests';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Achievements": Achievements,
    "AdminDashboard": AdminDashboard,
    "Assignments": Assignments,
    "ChromeExtension": ChromeExtension,
    "Dashboard": Dashboard,
    "Friends": Friends,
    "Home": Home,
    "Onboarding": Onboarding,
    "StudyAssistant": StudyAssistant,
    "StudyRooms": StudyRooms,
    "Tests": Tests,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};