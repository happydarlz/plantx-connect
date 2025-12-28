import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface SwipeNavigationProps {
  children: ReactNode;
}

const pages = ["/home", "/search", "/reels", "/profile"];

const SwipeNavigation = ({ children }: SwipeNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentIndex = pages.indexOf(location.pathname);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentIndex === -1) return;
    
    const startX = e.touches[0].clientX;
    
    const handleTouchEnd = (endEvent: TouchEvent) => {
      const endX = endEvent.changedTouches[0].clientX;
      const diff = startX - endX;
      const threshold = 80;
      
      if (diff > threshold && currentIndex < pages.length - 1) {
        navigate(pages[currentIndex + 1]);
      } else if (diff < -threshold && currentIndex > 0) {
        navigate(pages[currentIndex - 1]);
      }
      
      document.removeEventListener("touchend", handleTouchEnd);
    };
    
    document.addEventListener("touchend", handleTouchEnd);
  };

  // Only enable swipe on main pages
  if (!pages.includes(location.pathname)) {
    return <>{children}</>;
  }

  return (
    <div onTouchStart={handleTouchStart} className="min-h-screen">
      {children}
    </div>
  );
};

export default SwipeNavigation;
