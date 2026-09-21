export interface AnimationTokens {
  duration: DurationTokens;
  easing: EasingTokens;
  keyframes: KeyframeTokens;
}

export interface DurationTokens {
  fast: string;
  normal: string;
  slow: string;
  slower: string;
}

export interface EasingTokens {
  linear: string;
  ease: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
  spring: string;
  bounce: string;
}

export interface KeyframeTokens {
  spin: string;
  pulse: string;
  fadeIn: string;
  fadeOut: string;
  slideInUp: string;
  slideInDown: string;
  slideInLeft: string;
  slideInRight: string;
  scaleIn: string;
}

export const animation: AnimationTokens = {
  duration: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  keyframes: {
    spin: 'spin',
    pulse: 'pulse',
    fadeIn: 'fadeIn',
    fadeOut: 'fadeOut',
    slideInUp: 'slideInUp',
    slideInDown: 'slideInDown',
    slideInLeft: 'slideInLeft',
    slideInRight: 'slideInRight',
    scaleIn: 'scaleIn',
  },
};

export const keyframeStyles = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes slideInUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes slideInDown {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes slideInLeft {
  from { transform: translateX(-10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideInRight {
  from { transform: translateX(10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
`;
