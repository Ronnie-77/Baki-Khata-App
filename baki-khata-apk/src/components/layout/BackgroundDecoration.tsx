'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

export default function BackgroundDecoration() {
  const { resolvedTheme } = useTheme();
  const emptySubscribe = () => () => {};
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === 'dark';

  const circles = isDark
    ? [
        // Dark mode: deeper warm tones that blend with dark amber/yellow/orange gradient
        {
          color: 'bg-amber-700/20',
          size: 'w-72 h-72 md:w-96 md:h-96',
          top: 'top-[-5%]',
          left: 'left-[-10%]',
          delay: 0,
          duration: 20,
        },
        {
          color: 'bg-orange-800/20',
          size: 'w-64 h-64 md:w-80 md:h-80',
          top: 'top-[40%]',
          left: 'left-[60%]',
          delay: 2,
          duration: 25,
        },
        {
          color: 'bg-yellow-700/15',
          size: 'w-56 h-56 md:w-72 md:h-72',
          top: 'top-[70%]',
          left: 'left-[-5%]',
          delay: 4,
          duration: 22,
        },
        {
          color: 'bg-orange-600/15',
          size: 'w-48 h-48 md:w-64 md:h-64',
          top: 'top-[10%]',
          left: 'left-[50%]',
          delay: 1,
          duration: 18,
        },
      ]
    : [
        // Light mode: bright golden/orange tones that pop on the gradient
        {
          color: 'bg-yellow-300/40',
          size: 'w-72 h-72 md:w-96 md:h-96',
          top: 'top-[-5%]',
          left: 'left-[-10%]',
          delay: 0,
          duration: 20,
        },
        {
          color: 'bg-orange-300/35',
          size: 'w-64 h-64 md:w-80 md:h-80',
          top: 'top-[40%]',
          left: 'left-[60%]',
          delay: 2,
          duration: 25,
        },
        {
          color: 'bg-amber-200/30',
          size: 'w-56 h-56 md:w-72 md:h-72',
          top: 'top-[70%]',
          left: 'left-[-5%]',
          delay: 4,
          duration: 22,
        },
        {
          color: 'bg-orange-400/25',
          size: 'w-48 h-48 md:w-64 md:h-64',
          top: 'top-[10%]',
          left: 'left-[50%]',
          delay: 1,
          duration: 18,
        },
      ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {circles.map((circle, index) => (
        <motion.div
          key={index}
          className={`absolute ${circle.color} ${circle.size} rounded-full blur-3xl`}
          style={{
            top: circle.top,
            left: circle.left,
          }}
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.05, 0.95, 1.02, 1],
          }}
          transition={{
            duration: circle.duration,
            repeat: Infinity,
            delay: circle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Subtle radial glow overlay for depth */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_70%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_70%)]'
        }`}
      />
    </div>
  );
}
