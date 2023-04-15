import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from 'react-router-dom';
import axios from 'axios';

// eslint-disable-next-line custom-rules/no-global-css
import './index.scss';

import MainPage from './routes/MainPage';
import AddProjectPage from './routes/AddProjectPage';
import EditProjectPage from './routes/EditProjectPage';
import LoginPage from './routes/LoginPage';
import ErrorPage from './routes/ErrorPage';
import SignUpPage from './routes/SignUpPage';
import ProjectDetails from './routes/ProjectDetails';
import ShowcaseSettingsPage from './routes/adminpanel/ShowcaseSettingsPage';
import ContentSettingsPage from './routes/adminpanel/ContentSettingsPage';
import ManageUsersPage from './routes/adminpanel/ManageUsersPage';
import ManageProjectsPage from './routes/adminpanel/ManageProjectsPage';
import DashboardPage from './routes/adminpanel/DashboardPage';
import AdminPanel from './routes/AdminPanel';
import MyAccountPage from './routes/MyAccount/MyAccountPage';

import { AuthContextProvider } from '@/hooks/useAuth';
import { AppThemeProvider } from '@/hooks/useAppTheme';

if (import.meta.env.DEV) {
  axios.defaults.baseURL = 'http://localhost:5297/api/v1/';
} else {
  axios.defaults.baseURL = '/api/v1/';
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <MainPage />,
      },
      {
        path: 'add',
        element: <AddProjectPage />,
      },
      {
        path: 'edit/:projectId',
        element: <EditProjectPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignUpPage />,
      },
      {
        path: 'details/:projectId',
        element: <ProjectDetails />,
      },
      {
        path: 'account',
        element: <MyAccountPage />,
      },
      {
        path: 'adminpanel',
        element: <AdminPanel />,
        children: [
          {
            index: true,
            element: <Navigate to='dashboard' replace={true} />,
          },
          {
            path: 'showcase',
            element: <ShowcaseSettingsPage />,
          },
          {
            path: 'content',
            element: <ContentSettingsPage />,
          },
          {
            path: 'users',
            element: <ManageUsersPage />,
          },
          {
            path: 'projects',
            element: <ManageProjectsPage />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthContextProvider>
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
