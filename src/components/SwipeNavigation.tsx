import { ReactNode } from "react";

interface SwipeNavigationProps {
  children: ReactNode;
}

// Disabled swipe navigation to prevent interference with reels vertical scroll
// and other page scrolling behaviors
const SwipeNavigation = ({ children }: SwipeNavigationProps) => {
  return <>{children}</>;
};

export default SwipeNavigation;
