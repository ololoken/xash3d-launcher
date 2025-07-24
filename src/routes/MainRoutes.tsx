import Loadable from '../components/Loadable';
import MainLayout from '../layouts/MainLayout';
import { lazy } from 'react';

const Launcher = Loadable(lazy(() => import('../pages/Launcher')));

const [, , ...url] = new URL(import.meta.url).pathname.split('/').reverse();

url.pop();

export default {
  path: `${import.meta.env.PROD ? `${url.reverse().join('/')}/index.html` : ''}`,
  children: [
    {
      element: <MainLayout />,
      children: [
        {
          path: '',
          element: <Launcher />
        }
      ]
    }
  ]
};
