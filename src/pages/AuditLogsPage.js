// src/pages/AuditLogsPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { Tooltip } from "primereact/tooltip";

import useAppStore from "../store/useAppStore";
import "./AuditLogsPage.css";

// ------------------------------------------------------------------
// Timezone helpers
// ------------------------------------------------------------------
const browserTZ =
  (typeof Intl !== "undefined" &&
    Intl.DateTimeFormat().resolvedOptions().timeZone) ||
  "UTC";

const TZ_OPTIONS = [
  { label: `Auto (${browserTZ})`, value: "AUTO" },
  { label: "UTC", value: "UTC" },
  { label: "US — Eastern (New York)", value: "America/New_York" },
  { label: "US — Central (Chicago)", value: "America/Chicago" },
  { label: "US — Mountain (Denver)", value: "America/Denver" },
  { label: "US — Pacific (Los Angeles)", value: "America/Los_Angeles" },
  { label: "India — IST", value: "Asia/Kolkata" },
];

const fmtInTZ = (iso, tzChoice) => {
  if (!iso) return "-";
  try {
    const zone = tzChoice === "AUTO" ? browserTZ : tzChoice;
    return new Date(iso).toLocaleString("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
};

export default function AuditLogsPage() {
  const { auditLogs, fetchAuditLogs, loading } = useAppStore();

  // Fetch on mount
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // -------------------- Filters state --------------------
  const [globalQ, setGlobalQ] = useState("");
  const [statusF, setStatusF] = useState([]); // Multi
  const [actionF, setActionF] = useState(null);
  const [userF, setUserF] = useState(null);
  const [rangeF, setRangeF] = useState(null);

  // Timezone (persist)
  const [tz, setTz] = useState(localStorage.getItem("app.tz") || "AUTO");
  useEffect(() => {
    localStorage.setItem("app.tz", tz);
  }, [tz]);

  // -------------------- Base mapped rows --------------------
  const baseRows = useMemo(
    () =>
      (auditLogs || []).map((r) => ({
        id: r._id,
        createdAt: r.createdAt,
        time: fmtInTZ(r.createdAt, tz),
        user: r.userId || "—",
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId || "—",
        status: r.status,
        message: r.message || "—",
        ip: r.ip || "—",
        location: (() => {
          const L = r.location || {};
          const parts = [L.city, L.region, L.country].filter(Boolean);
          return parts.length ? parts.join(", ") : "—";
        })(),
        tzDetected:
          (r.location &&
            (r.location.appTimezone || r.location.detectedTimezone)) ||
          "—",
        ua: r.userAgent ? r.userAgent.substring(0, 120) : "—",
        raw: r,
      })),
    [auditLogs, tz]
  );

  // Options for filters
  const statusOptions = useMemo(() => {
    const s = new Set(baseRows.map((r) => r.status).filter(Boolean));
    const arr = Array.from(s);
    const order = ["success", "warning", "error", "info"];
    return arr
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .map((v) => ({ label: v, value: v }));
  }, [baseRows]);

  const actionOptions = useMemo(() => {
    const s = new Set(baseRows.map((r) => r.action).filter(Boolean));
    return Array.from(s)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((v) => ({ label: v, value: v }));
  }, [baseRows]);

  const userOptions = useMemo(() => {
    const s = new Set(
      baseRows.map((r) => r.user).filter((v) => v && v !== "—")
    );
    return Array.from(s)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((v) => ({ label: v, value: v }));
  }, [baseRows]);

  // -------------------- Filtered rows --------------------
  const filtered = useMemo(() => {
    const q = globalQ.trim().toLowerCase();

    const inRange = (createdAt) => {
      if (!rangeF || !Array.isArray(rangeF) || rangeF.length < 2) return true;
      const [start, end] = rangeF;
      if (!start || !end) return true;
      const t = new Date(createdAt).getTime();
      const s = new Date(start).setHours(0, 0, 0, 0);
      const e = new Date(end).setHours(23, 59, 59, 999);
      return t >= s && t <= e;
    };

    return baseRows.filter((r) => {
      if (!inRange(r.createdAt)) return false;
      if (statusF.length && !statusF.includes(r.status)) return false;
      if (actionF && r.action !== actionF) return false;
      if (userF && r.user !== userF) return false;

      if (!q) return true;
      const hay = [
        r.time,
        r.user,
        r.action,
        r.entityType,
        r.entityId,
        r.status,
        r.message,
        r.ip,
        r.location,
        r.tzDetected,
        r.ua,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [baseRows, globalQ, statusF, actionF, userF, rangeF]);

  // -------------------- Cell templates --------------------
  const statusTemplate = (row) => {
    const map = {
      success: "success",
      error: "danger",
      warning: "warning",
      info: "info",
    };
    return <Tag value={row.status} severity={map[row.status] || "info"} />;
  };

  const idBody = (row) => (
    <span className="mono" title={row.entityId}>
      {row.entityId}
    </span>
  );

  const messageBody = (row) => <span title={row.message}>{row.message}</span>;

  // Loading skeleton
  const LoadingTemplate = () => (
    <div className="audit-skeleton">
      {Array.from({ length: 10 }).map((_, i) => (
        <div className="audit-skel-row" key={i}>
          <Skeleton width="14rem" height="1rem" />
          <Skeleton width="8rem" height="1rem" />
          <Skeleton width="10rem" height="1rem" />
          <Skeleton width="8rem" height="1rem" />
          <Skeleton width="16rem" height="1rem" />
          <Skeleton width="6rem" height="1rem" />
          <Skeleton width="8rem" height="1rem" />
          <Skeleton width="14rem" height="1rem" />
          <Skeleton width="6rem" height="1rem" />
          <Skeleton width="20rem" height="1rem" />
        </div>
      ))}
    </div>
  );

  const clearFilters = () => {
    setGlobalQ("");
    setStatusF([]);
    setActionF(null);
    setUserF(null);
    setRangeF(null);
  };

  const timeHeader = tz === "AUTO" ? `Time (${browserTZ})` : `Time (${tz})`;

  return (
    <div className="audit-page">
      <Card
        title="Audit Logs"
        subTitle="Track actions by user, type, IP, and location"
        className="audit-card"
      >
        {/* Toolbar */}
        <div className="audit-toolbar">
          <div className="toolbar-left">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={globalQ}
                onChange={(e) => setGlobalQ(e.target.value)}
                placeholder="Search logs (user, action, message, IP …)"
                className="w-20rem"
              />
            </span>

            <MultiSelect
              value={statusF}
              onChange={(e) => setStatusF(e.value)}
              options={statusOptions}
              placeholder="Status"
              display="chip"
              className="w-14rem"
              maxSelectedLabels={3}
            />

            <Dropdown
              value={actionF}
              onChange={(e) => setActionF(e.value)}
              options={actionOptions}
              placeholder="Action"
              className="w-14rem"
              showClear
              filter
            />

            <Dropdown
              value={userF}
              onChange={(e) => setUserF(e.value)}
              options={userOptions}
              placeholder="User"
              className="w-14rem"
              showClear
              filter
            />

            <Calendar
              value={rangeF}
              onChange={(e) => setRangeF(e.value)}
              selectionMode="range"
              readOnlyInput
              placeholder="Date range"
              className="w-16rem"
              showIcon
            />
          </div>

          <div className="toolbar-right">
            {/* Timezone picker */}
            <Dropdown
              value={tz}
              onChange={(e) => setTz(e.value)}
              options={TZ_OPTIONS}
              placeholder="Timezone"
              className="w-20rem"
            />

            <Button
              label="Clear"
              icon="pi pi-filter-slash"
              className="p-button-text"
              onClick={clearFilters}
            />
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={() => fetchAuditLogs()}
              loading={loading}
            />
          </div>
        </div>

        {/* Table */}
        <div className="audit-table-wrap">
          {loading ? (
            <LoadingTemplate />
          ) : (
            <DataTable
              value={filtered}
              paginator
              rows={50}
              rowsPerPageOptions={[50, 100, 200]}
              stripedRows
              size="small"
              scrollable
              scrollHeight="66vh"
              responsiveLayout="scroll"
              emptyMessage="No audit logs found."
            >
              <Column
                field="time"
                header={timeHeader}
                style={{ minWidth: "200px" }}
              />
              <Column
                field="user"
                header="User"
                style={{ minWidth: "140px" }}
              />
              <Column
                field="action"
                header="Action"
                style={{ minWidth: "160px" }}
              />
              <Column
                field="entityType"
                header="Type"
                style={{ minWidth: "110px" }}
              />
              <Column
                field="entityId"
                header="Entity ID"
                body={idBody}
                style={{ minWidth: "220px" }}
              />
              <Column
                header="Status"
                body={statusTemplate}
                style={{ minWidth: "110px" }}
              />
              <Column field="ip" header="IP" style={{ minWidth: "140px" }} />
              <Column
                field="location"
                header="Location"
                style={{ minWidth: "220px" }}
              />
              <Column
                field="tzDetected"
                header="Detected TZ"
                style={{ minWidth: "150px" }}
              />
              <Column
                field="message"
                header="Message"
                body={messageBody}
                style={{ minWidth: "300px" }}
              />
            </DataTable>
          )}
        </div>
      </Card>

      <Tooltip target=".mono" />
    </div>
  );
}
