// src/components/parents/ParentCard.js
import React from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import SchedulerToggle from "../scheduler/SchedulerToggle";
import useAppStore from "../../store/useAppStore";
import "./ParentCard.css";

export default function ParentCard({
  parent,
  isSyncing,
  onEdit,
  onDelete,
  onSync,
  onSyncFromGhl,
  onAddChild,
  onEditChild,
  onTransferChild,
  onDeleteChild,
}) {
  const name = parent.alias || parent.name || "Unnamed";
  const { countdowns } = useAppStore();
  const globalOn = !!countdowns?.global?.enabled;

  return (
    <article className="parent-card">
      <div className="card-accent" />

      <header className="parent-card-header">
        <div className="parent-info">
          <Avatar
            label={(name || "?").charAt(0).toUpperCase()}
            shape="circle"
            className="parent-avatar"
          />
          <div className="parent-details">
            <h3 className="parent-name">{name}</h3>
            <div className="parent-id">
              <i className="pi pi-map-marker mr-2" />
              <span title={parent.locationId}>{parent.locationId}</span>
            </div>
          </div>
        </div>
        <div className="parent-quick">
          <Tag value={`${parent.children?.length || 0} Children`} />
        </div>
      </header>

      <section className="parent-card-body">
        {parent.children?.length ? (
          <div className="child-grid">
            {parent.children.map((child) => {
              const cname = child.alias || child.name || "Child";
              return (
                <div className="child-card-mini" key={child._id}>
                  <div className="mini-left">
                    <Avatar
                      label={(cname || "?").charAt(0).toUpperCase()}
                      className="child-avatar"
                      shape="circle"
                    />
                    <div className="child-text">
                      <div className="child-name">{cname}</div>
                      <div className="child-id">
                        <i className="pi pi-hashtag mr-2" />
                        <span title={child.locationId}>{child.locationId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mini-actions">
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-text p-button-icon-only"
                      onClick={() => onEditChild(child)}
                      tooltip="Edit / Transfer"
                    />
                    <Button
                      icon="pi pi-arrows-h"
                      className="p-button-text p-button-icon-only"
                      onClick={() => onTransferChild(child)}
                      tooltip="Move"
                    />
                    <Button
                      icon="pi pi-trash"
                      className="p-button-text p-button-danger p-button-icon-only"
                      onClick={() => onDeleteChild(child)}
                      tooltip="Delete"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-children">
            <i className="pi pi-users mr-2" />
            <span>No children linked.</span>
          </div>
        )}
      </section>

      <footer className="parent-card-footer">
        <div className="footer-actions left">
          <Button
            icon="pi pi-upload"
            className="p-button-help p-button-icon-only"
            onClick={() => onSync(parent)}
            disabled={isSyncing}
            tooltip="Sync to Children"
          />
          <Button
            icon="pi pi-download"
            className="p-button-info p-button-icon-only"
            onClick={() => onSyncFromGhl(parent)}
            disabled={isSyncing}
            tooltip="Sync From CLINGY"
          />
          <Button
            icon="pi pi-plus"
            className="p-button-success p-button-icon-only"
            onClick={() => onAddChild(parent)}
            tooltip="Add Child"
          />
        </div>
        <div className="footer-actions right">
          {/* SchedulerToggle will auto-hide if global is enabled */}
          {!globalOn && (
            <SchedulerToggle mode="parent" parent={parent} compact />
          )}
          <Button
            icon="pi pi-pencil"
            className="p-button-text p-button-icon-only"
            onClick={() => onEdit(parent)}
            tooltip="Edit Parent"
          />
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger p-button-icon-only"
            onClick={() => onDelete(parent)}
            tooltip="Delete Parent"
          />
        </div>
      </footer>
    </article>
  );
}
