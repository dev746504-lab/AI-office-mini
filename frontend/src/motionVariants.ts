import type { Variants } from 'framer-motion';

/** Container dung de cascade cac con theo thu tu (stagger). */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

/** Ap cho tung phan tu la (card, chart, widget...) ben trong 1 staggerContainer. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};
