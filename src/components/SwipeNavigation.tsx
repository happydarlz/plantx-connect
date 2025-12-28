import { ReactNode, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

interface SwipeNavigationProps {
  children: ReactNode;
}

const pages = ["/home", "/search", "/reels", "/profile"];

const SwipeNavigation = ({ children }: SwipeNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [direction, setDirection] = useState(0);

  const currentIndex = pages.indexOf(location.pathname);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (currentIndex === -1) return;

    if (offset < -threshold || velocity < -500) {
      // Swipe left - go to next page
      if (currentIndex < pages.length - 1) {
        setDirection(1);
        navigate(pages[currentIndex + 1]);
      }
    } else if (offset > threshold || velocity > 500) {
      // Swipe right - go to previous page
      if (currentIndex > 0) {
        setDirection(-1);
        navigate(pages[currentIndex - 1]);
      }
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  // Only enable swipe on main pages
  if (!pages.includes(location.pathname)) {
    return <>{children}</>;
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="min-h-screen"
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default SwipeNavigation;
