// src/components/simulate/SimulateButton.tsx
// STRATFIT — The God Mode Trigger

import styles from './SimulateButton.module.css';

interface Props {
  onClick: () => void;
  isRunning: boolean;
  disabled?: boolean;
}

export default function SimulateButton({ onClick, isRunning, disabled }: Props) {
  return (
    <button
      className={`${styles.btn} ${isRunning ? styles.running : ''}`}
      onClick={onClick}
      disabled={disabled || isRunning}
    >
      {isRunning ? (
        <>
          <span className={styles.spinner} />
          <span>RUNNING...</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          <span>SIMULATE</span>
          <span className={styles.badge}>10K</span>
        </>
      )}
    </button>
  );
}

