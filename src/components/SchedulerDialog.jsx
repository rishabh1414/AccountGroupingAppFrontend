// src/components/SchedulerDialog.jsx
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import useAppStore from "../store/useAppStore";

const scheduleTypes = [
  { label: "Every N minutes", value: "everyNMinutes" },
  { label: "Every N hours", value: "everyNHours" },
  { label: "Daily at time", value: "daily" },
  { label: "Weekly (day+time)", value: "weekly" },
  { label: "Monthly (date+time)", value: "monthly" },
  { label: "Custom cron", value: "cron" },
];

const weekdays = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const isValidDate = (v) => v instanceof Date && !isNaN(v.valueOf());

const toDateFromTime = (val) => {
  if (isValidDate(val)) return val;
  const s = typeof val === "string" ? val : "09:00";
  const [hh, mm] = s.split(":").map((n) => parseInt(n, 10) || 0);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
};

const toHHmm = (val) => {
  if (isValidDate(val)) {
    const hh = String(val.getHours()).padStart(2, "0");
    const mm = String(val.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  if (typeof val === "string" && /^\d{2}:\d{2}$/.test(val)) return val;
  return "09:00";
};

export default function SchedulerDialog({
  visible,
  onHide,
  mode,
  parent,
  onSaved,
}) {
  const { enableGlobalSchedule, enableParentSchedule } = useAppStore();

  const [form, setForm] = useState({
    scheduleType: "everyNMinutes",
    minutesInterval: 10,
    hoursInterval: 1,
    timeOfDay: "09:00",
    dayOfWeek: 1,
    dayOfMonth: 1,
    cron: "",
  });

  useEffect(() => {
    if (visible) {
      setForm({
        scheduleType: "everyNMinutes",
        minutesInterval: 10,
        hoursInterval: 1,
        timeOfDay: "09:00",
        dayOfWeek: 1,
        dayOfMonth: 1,
        cron: "",
      });
    }
  }, [visible]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    const payload = { scheduleType: form.scheduleType };

    if (form.scheduleType === "everyNMinutes") {
      payload.minutesInterval = Number(form.minutesInterval || 1);
    }

    if (form.scheduleType === "everyNHours") {
      payload.hoursInterval = Number(form.hoursInterval || 1);
    }

    if (["daily", "weekly", "monthly"].includes(form.scheduleType)) {
      payload.timeOfDay = toHHmm(form.timeOfDay);
      if (form.scheduleType === "weekly") payload.dayOfWeek = form.dayOfWeek;
      if (form.scheduleType === "monthly") payload.dayOfMonth = form.dayOfMonth;
    }

    if (form.scheduleType === "cron") {
      const c = (form.cron || "").trim();
      payload.cron = c || undefined;
    }

    if (mode === "global") await enableGlobalSchedule(payload);
    else await enableParentSchedule(parent._id, payload);

    onSaved?.();
    onHide();
  };

  return (
    <Dialog
      header={
        mode === "global"
          ? "Enable Global Auto-Sync"
          : `Enable Auto-Sync: ${parent?.alias || parent?.name}`
      }
      visible={visible}
      onHide={onHide}
      style={{ width: 560, maxWidth: "95vw" }}
      dismissableMask
    >
      <div className="p-fluid grid formgrid">
        <div className="field col-12 md:col-6">
          <label>Schedule Type</label>
          <Dropdown
            value={form.scheduleType}
            options={scheduleTypes}
            onChange={(e) => update({ scheduleType: e.value })}
          />
        </div>

        {form.scheduleType === "everyNMinutes" && (
          <div className="field col-12 md:col-6">
            <label>Every N minutes</label>
            <InputNumber
              value={form.minutesInterval}
              min={1}
              onValueChange={(e) => update({ minutesInterval: e.value })}
            />
          </div>
        )}

        {form.scheduleType === "everyNHours" && (
          <div className="field col-12 md:col-6">
            <label>Every N hours</label>
            <InputNumber
              value={form.hoursInterval}
              min={1}
              onValueChange={(e) => update({ hoursInterval: e.value })}
            />
          </div>
        )}

        {["daily", "weekly", "monthly"].includes(form.scheduleType) && (
          <div className="field col-12 md:col-6">
            <label>Time of day</label>
            <Calendar
              value={toDateFromTime(form.timeOfDay)}
              onChange={(e) => update({ timeOfDay: e.value })}
              timeOnly
              hourFormat="24"
              showIcon
            />
          </div>
        )}

        {form.scheduleType === "weekly" && (
          <div className="field col-12 md:col-6">
            <label>Day of week</label>
            <Dropdown
              value={form.dayOfWeek}
              options={weekdays}
              onChange={(e) => update({ dayOfWeek: e.value })}
            />
          </div>
        )}

        {form.scheduleType === "monthly" && (
          <div className="field col-12 md:col-6">
            <label>Day of month</label>
            <InputNumber
              value={form.dayOfMonth}
              min={1}
              max={31}
              onValueChange={(e) => update({ dayOfMonth: e.value })}
            />
          </div>
        )}

        {form.scheduleType === "cron" && (
          <div className="field col-12">
            <label>Cron expression</label>
            <input
              className="p-inputtext p-component w-full"
              value={form.cron}
              onChange={(e) => update({ cron: e.target.value })}
              placeholder="e.g. 0 */2 * * *"
            />
          </div>
        )}

        <div className="col-12 flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" className="p-button-text" onClick={onHide} />
          <Button label="Enable" icon="pi pi-check" onClick={save} />
        </div>
      </div>
    </Dialog>
  );
}
