// src/components/compare/ScenarioStrip.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Scenario Toggle Strip with CRUD
//
// Demo cap: Current Structure + 3 scenarios max.
// Cannot delete Current Structure.
// Only active scenario editable.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useState, useCallback } from "react";
import type { CompareScenario } from "@/state/compareViewStore";
import styles from "./CompareView.module.css";

interface ScenarioStripProps {
  currentStructureName: string;
  scenarios: CompareScenario[];
  activeId: string;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  maxScenarios: number;
}

const ScenarioStrip: React.FC<ScenarioStripProps> = memo(({
  currentStructureName,
  scenarios,
  activeId,
  onSelect,
  onDuplicate,
  onRename,
  onDelete,
  onAdd,
  maxScenarios,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = useCallback((id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  }, [renamingId, renameValue, onRename]);

  const canAdd = scenarios.length < maxScenarios;

  return (
    <div className={styles.scenarioStrip}>
      <span className={styles.scenarioStripLabel}>Scenarios</span>

      {/* Current Structure — non-editable, non-deletable */}
      <button
        type="button"
        className={styles.scenarioTabCurrent}
        title="Current Structure (read-only reference)"
      >
        {currentStructureName}
      </button>

      {/* User scenarios */}
      {scenarios.map((s) => {
        const isActive = s.id === activeId;
        const isRenaming = renamingId === s.id;

        return (
          <React.Fragment key={s.id}>
            {isRenaming ? (
              <input
                className={styles.renameInput}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                }}
                autoFocus
                spellCheck={false}
              />
            ) : (
              <button
                type="button"
                className={isActive ? styles.scenarioTabActive : styles.scenarioTab}
                onClick={() => onSelect(s.id)}
                onDoubleClick={() => startRename(s.id, s.name)}
                title={isActive ? "Active scenario (double-click to rename)" : "Click to select"}
              >
                {s.name}
              </button>
            )}

            {/* CRUD actions — only visible for active scenario */}
            {isActive && !isRenaming && (
              <div className={styles.scenarioActions}>
                <button
                  type="button"
                  className={styles.scenarioActionBtn}
                  onClick={() => onDuplicate(s.id)}
                  title="Duplicate scenario"
                  disabled={!canAdd}
                >
                  Dup
                </button>
                <button
                  type="button"
                  className={styles.scenarioActionBtn}
                  onClick={() => startRename(s.id, s.name)}
                  title="Rename scenario"
                >
                  Ren
                </button>
                <button
                  type="button"
                  className={`${styles.scenarioActionBtn} ${styles.scenarioActionBtnDanger}`}
                  onClick={() => onDelete(s.id)}
                  title="Delete scenario"
                >
                  Del
                </button>
              </div>
            )}
          </React.Fragment>
        );
      })}

      <div className={styles.scenarioSpacer} />

      {/* Add scenario */}
      <button
        type="button"
        className={styles.scenarioAddBtn}
        onClick={onAdd}
        disabled={!canAdd}
        title={canAdd ? "Add new scenario" : "Maximum 3 scenarios reached"}
      >
        + Scenario
      </button>
    </div>
  );
});

ScenarioStrip.displayName = "ScenarioStrip";
export default ScenarioStrip;



