import React, { useEffect, useState } from "react";
import useAppStore from "../../store/useAppStore";
import "./FloatingTimer.css";

export default function FloatingTimer() {
  const { countdowns, refreshCountdownAll } = useAppStore();
  const [secs, setSecs] = useState(null);
  const [label, setLabel] = useState("");

  const pickSoonest = (map) => {
    const vals = Object.values(map || {}).filter(
      (v) => v?.enabled && typeof v.seconds === "number"
    );
    if (!vals.length) return null;
    vals.sort((a, b) => a.seconds - b.seconds);
    return vals[0];
  };

  useEffect(() => {
    const best = pickSoonest(countdowns);
    if (!best) {
      setSecs(null);
      setLabel("");
      return;
    }
    const s =
      typeof best.seconds === "number" ? Math.max(1, best.seconds) : null; // <- avoid 0
    setSecs(s);
    setLabel(
      best.scope === "global" ? "Auto-Sync: Global" : "Auto-Sync: Parent"
    );
  }, [countdowns]);

  useEffect(() => {
    let alive = true;
    const prime = async () => {
      const map = await refreshCountdownAll();
      if (!alive) return;
      const best = pickSoonest(map);
      if (!best) {
        setSecs(null);
        setLabel("");
        return;
      }
      const s =
        typeof best.seconds === "number" ? Math.max(1, best.seconds) : null; // <- avoid 0
      setSecs(s);
      setLabel(
        best.scope === "global" ? "Auto-Sync: Global" : "Auto-Sync: Parent"
      );
    };
    prime();
    const sync = setInterval(prime, 15000);
    return () => {
      alive = false;
      clearInterval(sync);
    };
  }, [refreshCountdownAll]);

  useEffect(() => {
    if (typeof secs !== "number") return;
    const t = setInterval(
      () => setSecs((v) => (typeof v !== "number" ? v : Math.max(0, v - 1))),
      1000
    );
    return () => clearInterval(t);
  }, [secs]);

  if (typeof secs !== "number") return null;

  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");

  return (
    <div className={`floating-timer ${secs <= 10 ? "pulse" : ""}`}>
      <div className="ft-title">{label}</div>
      <div className="ft-time">
        {h}:{m}:{s}
      </div>
    </div>
  );
}
