import { motion } from 'framer-motion';
import { useStore } from '../store';

export function AddButton() {
  const setAdminOpen = useStore((state) => state.setAdminOpen);

  return (
    <motion.button
      className="add-button"
      onClick={() => setAdminOpen(true)}
      // Hit constantly — keep motion subtle and snappy
      whileHover={{ scale: 1.05, transition: { duration: 0.15, ease: 'easeOut' } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.1, ease: 'easeOut' } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: 'spring', duration: 0.5, bounce: 0.2 }}
      data-tour-target="add-button"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </motion.button>
  );
}
