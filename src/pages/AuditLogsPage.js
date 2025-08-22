// src/pages/AuditLogsPage.js
import React, { useEffect, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import useAppStore from "../store/useAppStore";
import "./AuditLogsPage.css";

const fmtIST = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }); // IST
  } catch {
    return iso;
  }
};

export default function AuditLogsPage() {
  const { auditLogs, fetchAuditLogs, loading } = useAppStore();

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const rows = useMemo(
    () =>
      (auditLogs || []).map((r) => ({
        id: r._id,
        time: fmtIST(r.createdAt),
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
        tz:
          (r.location &&
            (r.location.appTimezone || r.location.detectedTimezone)) ||
          "—",
        ua: r.userAgent ? r.userAgent.substring(0, 80) : "—",
        raw: r, // keep raw for expansion if needed
      })),
    [auditLogs]
  );

  const statusTemplate = (row) => {
    const map = {
      success: "success",
      error: "danger",
      warning: "warning",
      info: "info",
    };
    return <Tag value={row.status} severity={map[row.status] || "info"} />;
  };

  return (
    <div className="audit-page">
      <Card title="Audit Logs" subTitle="Actor, action, IP & location">
        <DataTable
          value={rows}
          paginator
          rows={20}
          rowsPerPageOptions={[20, 50, 100]}
          loading={loading}
          stripedRows
          size="small"
          scrollable
          scrollHeight="70vh"
          responsiveLayout="scroll"
          emptyMessage="No audit logs yet."
        >
          <Column
            field="time"
            header="Time (IST)"
            style={{ minWidth: "180px" }}
          />
          <Column field="user" header="User" style={{ minWidth: "140px" }} />
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
          <Column field="tz" header="TZ" style={{ minWidth: "150px" }} />
          <Column
            field="message"
            header="Message"
            style={{ minWidth: "300px" }}
          />
          {/* <Column field="ua" header="User-Agent" style={{minWidth:"300px"}} /> */}
        </DataTable>
      </Card>
    </div>
  );
}
