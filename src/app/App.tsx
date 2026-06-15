import { RouterProvider } from 'react-router';
import { router } from './routes';
import { NotificationProvider } from './contexts/notification-context';

export default function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  );
}