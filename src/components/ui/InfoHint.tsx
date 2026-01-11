import React, { memo } from "react";
import s from "./InfoHint.module.css";

type Props = {
  title?: string;
  onClick?: () => void;
  className?: string;
};

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export const InfoHint = memo(function InfoHint({ title, onClick, className }: Props) {
  return (
    <button
      type="button"
      className={cx(s.hint, className)}
      aria-label={title ?? "Info"}
      title={title}
      onClick={onClick}
    >
      <span className={s.icon}>i</span>
    </button>
  );
});

