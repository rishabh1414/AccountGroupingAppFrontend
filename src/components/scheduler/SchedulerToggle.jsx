// src/components/scheduler/SchedulerToggle.jsx
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import useAppStore from "../../store/useAppStore";
import SchedulerDialog from "../SchedulerDialog";
import "./SchedulerToggle.css";

function fmt(sec) {
  if (typeof sec !== "number") return "00:00:00"; // <-- show zeros instead of blank
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function SchedulerToggle({
  mode = "global",
  parent = null,
  compact = false,
}) {
  const {
    countdowns,
    refreshCountdownForGlobal,
    refreshCountdownForParent,
    refreshCountdownAll,
    disableSchedule,
  } = useAppStore();

  const globalOn = !!countdowns?.global?.enabled;
  const hideSelf = mode === "parent" && globalOn;

  const key =
    mode === "global" ? "global" : `parent:${parent?._id || "unknown"}`;
  const mine = countdowns[key];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [seconds, setSeconds] = useState(null);

  useEffect(() => {
    if (hideSelf) {
      setSeconds(null);
      return;
    }
    if (mine?.enabled && typeof mine.seconds === "number")
      setSeconds(mine.seconds);
    else setSeconds(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideSelf, mine?.enabled, mine?.seconds]);

  useEffect(() => {
    let stop = false;
    const prime = async () => {
      if (hideSelf) return;
      const d =
        mode === "global"
          ? await refreshCountdownForGlobal()
          : parent?._id
          ? await refreshCountdownForParent(parent._id)
          : null;
      if (!stop) setSeconds(d?.enabled ? d.seconds : null);
    };
    prime();

    let i = 0;
    const t = setInterval(async () => {
      if (hideSelf) return;
      i++;
      setSeconds((v) => (v == null ? v : Math.max(0, v - 1)));
      if (i % 20 === 0) await prime();
    }, 1000);

    return () => {
      stop = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideSelf, mode, parent?._id]);

  const isRunning = !!(mine && mine.enabled);
  const open = () => setDialogOpen(true);

  const stop = async () => {
    const body =
      mode === "global"
        ? { scope: "global" }
        : { scope: "parent", parentId: parent?._id };
    await disableSchedule(body);
    await refreshCountdownAll();
    setSeconds(null);
  };

  const afterEnable = async () => {
    const d =
      mode === "global"
        ? await refreshCountdownForGlobal()
        : parent?._id
        ? await refreshCountdownForParent(parent._id)
        : null;
    if (d?.enabled && typeof d.seconds === "number") setSeconds(d.seconds);
    await refreshCountdownAll();
  };

  const btnIdRef = useRef(
    `sch-${mode}-${parent?._id || "global"}-${Math.random()
      .toString(36)
      .slice(2)}`
  );

  if (hideSelf) return null;

  return (
    <>
      {!isRunning && (
        <Tooltip
          target={`#${btnIdRef.current}`}
          content={
            mode === "global"
              ? "Enable Global Auto-Sync"
              : "Enable Auto-Sync for this Parent"
          }
          position="top"
        />
      )}

      {isRunning ? (
        <div
          className="sch-toggle running"
          style={{
            display: "flex",
            alignItems: "center",
            gap: compact ? 6 : 8,
          }}
        >
          <Button
            id={btnIdRef.current}
            icon="pi pi-stop"
            className="p-button-danger p-button-icon-only"
            onClick={stop}
            tooltip="Stop Auto-Sync"
            tooltipOptions={{ position: "top" }}
          />
          <span className="countdown-chip">{fmt(seconds)}</span>
        </div>
      ) : (
        <Button
          id={btnIdRef.current}
          icon="pi pi-clock"
          className="p-button-help p-button-icon-only"
          onClick={open}
        />
      )}

      <SchedulerDialog
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        mode={mode}
        parent={parent}
        onSaved={afterEnable}
      />
    </>
  );
}
