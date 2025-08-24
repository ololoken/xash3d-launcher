import './i18n'
import Routes from './routes';
import Snackbar from './components/Snackbar';
import ThemeCustomization from './theme';
import { YaGamesProvider } from './contexts/YaGamesContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleError = (error: Error) => {
      switch (true) {
        case import.meta.env.DEV:
          console.error('dev mode error, ignoring', error);
          return;
        default:
          console.error(error);
          //navigate(`${import.meta.env.BASE_URL}/error`);
      }
    };
    onerror = (message, file, lineNo, columnNo, error) => {
      if (error)
        // return true here to prevent firing the default event handler
        return handleError(error);
      handleError(new Error(JSON.stringify({ message, file, lineNo, columnNo })));
    };
    // handle async errors
    onunhandledrejection = (event) => console.warn(`UNHANDLED PROMISE REJECTION: ${event.reason}`);
    return () => { onerror = onunhandledrejection = null }
  }, []);


  return (
    <ThemeCustomization>
      <YaGamesProvider>
        <Routes />
        <Snackbar />
      </YaGamesProvider>
    </ThemeCustomization>
  );
}
