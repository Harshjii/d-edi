import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const { setIsLoading } = useLoading();

  useEffect(() => {
    // Show loader on route change
    setIsLoading(true);

    // Scroll to top of the page
    window.scrollTo(0, 0);

    // Hide loader after a short delay to give a sense of transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [pathname, setIsLoading]);

  return null; // This component doesn't render any UI
};

export default ScrollToTop;