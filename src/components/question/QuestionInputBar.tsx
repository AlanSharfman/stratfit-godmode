import React, { useState, KeyboardEvent } from "react";
import styles from "./QuestionInputBar.module.css";

interface Props {
  onSubmit: (question: string) => void;
}

export default function QuestionInputBar({ onSubmit }: Props) {
  const [value, setValue] = useState("");

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
        placeholder="Ask a financial decision question…"
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
