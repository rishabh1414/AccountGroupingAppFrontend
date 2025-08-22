import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";

import useAppStore from "../store/useAppStore";
import PageHeader from "../components/common/PageHeader";
import useConfirmation from "../hooks/useConfirmation";
import ChildCard from "../components/children/ChildCard";
import ChildForm from "../components/children/ChildForm";
import "./ChildrenPage.css"; // Import the new CSS file

const ChildrenPage = () => {
  const toast = useRef(null);
  const [ConfirmationDialog, confirm] = useConfirmation();

  const { children, loading, error, fetchChildren, fetchParents, deleteChild } =
    useAppStore();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    fetchChildren();
    fetchParents();
  }, []);

  const handleAdd = () => {
    setSelectedChild(null);
    setIsFormVisible(true);
  };

  const handleEditOrTransfer = (child) => {
    setSelectedChild(child);
    setIsFormVisible(true);
  };

  const handleDelete = (child) => {
    confirm({
      header: "Delete Child",
      message: `Are you sure you want to delete "${
        child.alias || child.name
      }"? This action cannot be undone.`,
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await deleteChild(child._id);
          toast.current.show({
            severity: "success",
            summary: "Deleted",
            detail: "Child account has been removed.",
            life: 3000,
          });
        } catch (e) {
          toast.current.show({
            severity: "error",
            summary: "Delete Failed",
            detail: e.message,
            life: 3000,
          });
        }
      },
    });
  };

  const headerActions = (
    <Button label="Add Child" icon="pi pi-plus" onClick={handleAdd} />
  );

  const renderContent = () => {
    if (loading && children.length === 0) {
      return (
        <div className="flex justify-content-center align-items-center h-20rem">
          <ProgressSpinner />
        </div>
      );
    }

    if (error) {
      return <Message severity="error" text={error} className="w-full" />;
    }

    if (!loading && children.length === 0) {
      return (
        <Message
          severity="info"
          text="No child accounts found. Click 'Add Child' to get started."
          className="w-full"
        />
      );
    }

    return (
      <div className="children-grid">
        {children.map((child) => (
          <div key={child._id}>
            <ChildCard
              child={child}
              onEdit={handleEditOrTransfer}
              onTransfer={handleEditOrTransfer}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmationDialog />
      <PageHeader
        title="Children Dashboard"
        subtitle="Manage all sub-accounts across different parents."
        actions={headerActions}
      />

      {renderContent()}

      <ChildForm
        isVisible={isFormVisible}
        onHide={() => setIsFormVisible(false)}
        editChild={selectedChild}
      />
    </div>
  );
};

export default ChildrenPage;
