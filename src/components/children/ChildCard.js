import React, { useRef } from "react";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { Toast } from "primereact/toast";
import { Avatar } from "primereact/avatar";
import "./ChildCard.css"; // Import the new custom CSS

const ChildCard = ({ child, onEdit, onDelete, onTransfer }) => {
  const toast = useRef(null);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.current.show({
        severity: "success",
        summary: "Copied",
        detail: `${type} copied to clipboard!`,
        life: 3000,
      });
    });
  };

  const displayName = child.alias || child.name;
  const parentName = child.parentId?.name || "N/A";
  const initial = (child.name || "C").charAt(0).toUpperCase();

  return (
    <>
      <Toast ref={toast} position="bottom-right" />
      <div className="child-card">
        <div className="child-card-header">
          <Avatar
            label={initial}
            size="large"
            shape="circle"
            className="child-card-avatar"
          />
          <div className="child-card-details">
            <h3 className="child-card-name" title={child.name}>
              {displayName}
            </h3>
            <div className="child-card-id-container">
              <span>ID: {child.locationId}</span>
              <Tooltip target={`.copy-btn-child-${child._id}`} />
              <Button
                icon="pi pi-copy"
                className={`p-button-text p-button-sm p-button-rounded ml-1 copy-btn-child-${child._id}`}
                data-pr-tooltip="Copy Location ID"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(child.locationId, "Location ID");
                }}
              />
            </div>
          </div>
        </div>

        <div className="child-card-body">
          <div className="parent-info-container">
            <i className="pi pi-users parent-info-icon"></i>
            <div className="parent-info-text">
              <div className="label">Parent Account</div>
              <div className="name">{parentName}</div>
            </div>
          </div>
        </div>

        <div className="child-card-footer">
          <Button
            icon="pi pi-pencil"
            className="p-button-text p-button-secondary"
            tooltip="Edit Alias"
            onClick={() => onEdit(child)}
          />
          <Button
            icon="pi pi-arrows-h"
            className="p-button-text p-button-help"
            tooltip="Transfer to another Parent"
            onClick={() => onTransfer(child)}
          />
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            tooltip="Delete Child"
            onClick={() => onDelete(child)}
          />
        </div>
      </div>
    </>
  );
};

export default ChildCard;
