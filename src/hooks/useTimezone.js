// src/hooks/useTimezone.js
import { useEffect, useState } from "react";

export default function useTimezone() {
  const [tz, setTz] = useState(
    localStorage.getItem("tz") ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "Asia/Kolkata"
  );

  useEffect(() => {
    localStorage.setItem("tz", tz);
  }, [tz]);

  return [tz, setTz];
}
