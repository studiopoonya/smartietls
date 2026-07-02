import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function GlowCard({ children, className, style, onClick, hover = true }) {
  return (
    <motion.div
      className={cn('glow-card', className)}
      style={{ padding: 24, ...style }}
      whileHover={hover ? { y: -2 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
