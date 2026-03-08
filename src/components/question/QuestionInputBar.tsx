import React, { useState, KeyboardEvent } from "react";
import styles from "./QuestionInputBar.module.css";
import { useTypewriterHint } from "@/hooks/useTypewriterHint";

const HINTS = [
  "How much runway remains if burn increases 20%?",
  "What's the minimum ARR to hit profitability?",
  "What is our biggest execution risk this quarter?",
  "Should we extend runway or accelerate growth?",
  "What does healthy EBITDA look like at our stage?",
  "Ask a strategic decision…",
];

interface Props {
  onSubmit: (question: string) => void;
}

export default function QuestionInputBar({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const hint = useTypewriterHint({ phrases: HINTS });

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.input}
        placeholder="Ask a strategic decision…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button className={styles.button} onClick={handleSubmit}>
        Ask
      </button>
    </div>
  );
}
