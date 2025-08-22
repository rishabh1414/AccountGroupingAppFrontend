// src/pages/ParentsPage.js
import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { Helmet } from "react-helmet-async";

import useAppStore from "../store/useAppStore";
import PageHeader from "../components/common/PageHeader";
import ParentCard from "../components/parents/ParentCard";
import ParentForm from "../components/parents/ParentForm";
import ChildForm from "../components/children/ChildForm";
import useConfirmation from "../hooks/useConfirmation";

import SchedulerDialog from "../components/SchedulerDialog";

import "./ParentsPage.css";

import SchedulerToggle from "../components/scheduler/SchedulerToggle";
const ParentsPage = () => {
  const toast = useRef(null);
  const [ConfirmationDialog, confirm] = useConfirmation();

  const {
    parents,
    loading,
    error,
    fetchParents,
    deleteParent,
    syncParent,
    syncAll,
    syncParentFromGhl,
    deleteChild,
  } = useAppStore();

  const [isParentFormVisible, setIsParentFormVisible] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [isChildFormVisible, setIsChildFormVisible] = useState(false);
  const [parentForNewChild, setParentForNewChild] = useState(null);
  const [syncingParentId, setSyncingParentId] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);

  // Scheduler dialog state
  const [schedVisible, setSchedVisible] = useState(false);
  const [schedMode, setSchedMode] = useState("global"); // "global" | "parent"
  const [schedParent, setSchedParent] = useState(null);

  useEffect(() => {
    fetchParents();

    useAppStore.getState().getActiveSchedule();
  }, [fetchParents]);

  // --- Parent Actions ---
  const handleAddParent = () => {
    setSelectedParent(null);
    setIsParentFormVisible(true);
  };

  const handleEditParent = (parent) => {
    setSelectedParent(parent);
    setIsParentFormVisible(true);
  };

  const handleDeleteParent = (parent) => {
    confirm({
      header: "Delete Parent",
      message: `Are you sure you want to delete "${
        parent.alias || parent.name
      }"? This action cannot be undone.`,
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await deleteParent(parent._id);
          toast.current.show({
            severity: "success",
            summary: "Deleted",
            detail: "Parent account has been removed.",
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

  const handleSyncFromGhl = async (parent) => {
    confirm({
      header: `Sync From CLINGY: ${parent.alias || parent.name}`,
      message: `Fetch latest custom values from CLINGY for "${
        parent.alias || parent.name
      }" and update its children. Proceed?`,
      acceptClassName: "p-button-info",
      accept: async () => {
        setSyncingParentId(parent._id);
        try {
          const result = await syncParentFromGhl(parent._id);
          toast.current.show({
            severity: "success",
            summary: "Parent Synced",
            detail: result.message,
            life: 3000,
          });
        } catch (e) {
          toast.current.show({
            severity: "error",
            summary: "Sync Failed",
            detail: e.message,
            life: 3000,
          });
        } finally {
          setSyncingParentId(null);
        }
      },
    });
  };

  // Child Actions
  const handleAddChild = (parent) => {
    setParentForNewChild(parent);
    setSelectedChild(null);
    setIsChildFormVisible(true);
  };
  const handleEditOrTransferChild = (child) => {
    setSelectedChild(child);
    const parentOfChild = parents.find((p) =>
      p.children.some((c) => c._id === child._id)
    );
    setParentForNewChild(parentOfChild);
    setIsChildFormVisible(true);
  };
  const handleDeleteChild = (child) => {
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

  const handleSync = async (parent) => {
    confirm({
      header: `Sync Parent: ${parent.alias || parent.name}`,
      message: `Push this parent's custom values to all ${
        parent.children?.length || 0
      } children?`,
      acceptClassName: "p-button-help",
      accept: async () => {
        setSyncingParentId(parent._id);
        try {
          const result = await syncParent(parent._id);
          toast.current.show({
            severity: "success",
            summary: "Sync Started",
            detail: result.message,
            life: 3000,
          });
        } catch (e) {
          toast.current.show({
            severity: "error",
            summary: "Sync Failed",
            detail: e.message,
            life: 3000,
          });
        } finally {
          setSyncingParentId(null);
        }
      },
    });
  };

  const handleGlobalSync = () => {
    confirm({
      header: "Start Global Sync",
      message: `Fetch master values from CLINGY and overwrite them on ALL parents and children. Continue?`,
      acceptClassName: "p-button-warning",
      accept: async () => {
        setIsGlobalSyncing(true);
        try {
          const result = await syncAll();
          toast.current.show({
            severity: "success",
            summary: "Global Sync Completed",
            detail: result.message,
            life: 5000,
          });
        } catch (e) {
          toast.current.show({
            severity: "error",
            summary: "Global Sync Failed",
            detail: e.message,
            life: 5000,
          });
        } finally {
          setIsGlobalSyncing(false);
        }
      },
    });
  };

  // Scheduler openers
  const openGlobalScheduler = () => {
    setSchedMode("global");
    setSchedParent(null);
    setSchedVisible(true);
  };
  const openParentScheduler = (parent) => {
    setSchedMode("parent");
    setSchedParent(parent);
    setSchedVisible(true);
  };

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button
        label="Global Sync"
        icon="pi pi-sync"
        className="p-button-secondary"
        onClick={handleGlobalSync}
        loading={isGlobalSyncing || undefined}
      />
      {/* Single animated toggle (start ↔ stop) with inline countdown */}
      <SchedulerToggle mode="global" />
      <Button label="Add Parent" icon="pi pi-plus" onClick={handleAddParent} />
    </div>
  );

  const renderContent = () => {
    if (loading && parents.length === 0) {
      return (
        <div className="flex justify-content-center align-items-center h-20rem">
          <ProgressSpinner />
        </div>
      );
    }
    if (error) {
      return <Message severity="error" text={error} className="w-full" />;
    }
    if (!loading && parents.length === 0) {
      return (
        <Message
          severity="info"
          text="No parent accounts found. Click 'Add Parent' to get started."
          className="w-full"
        />
      );
    }

    return (
      <div className="parents-grid">
        {parents.map((parent) => (
          <ParentCard
            key={parent._id}
            parent={parent}
            onEdit={handleEditParent}
            onDelete={handleDeleteParent}
            onSync={handleSync}
            onSyncFromGhl={handleSyncFromGhl}
            onAddChild={handleAddChild}
            isSyncing={syncingParentId === parent._id}
            onEditChild={handleEditOrTransferChild}
            onTransferChild={handleEditOrTransferChild}
            onDeleteChild={handleDeleteChild}
            onSchedule={() => openParentScheduler(parent)} // NEW
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <Helmet>
        <title>Dashboard - Account Grouping App</title>
        <meta name="description" content="View and manage grouped accounts." />
      </Helmet>
      <h1>Dashboard</h1>

      <Toast ref={toast} />
      <ConfirmationDialog />

      <PageHeader
        title="Agency & Sub-Account Manager"
        subtitle="Centralized view and management of parent agencies and their children."
        actions={headerActions}
      />

      {renderContent()}

      <ParentForm
        isVisible={isParentFormVisible}
        onHide={() => setIsParentFormVisible(false)}
        editParent={selectedParent}
      />

      <ChildForm
        isVisible={isChildFormVisible}
        onHide={() => setIsChildFormVisible(false)}
        editChild={selectedChild}
        preselectedParent={parentForNewChild}
      />

      {/* NEW: scheduler dialog & fixed countdown bar */}
      <SchedulerDialog
        visible={schedVisible}
        onHide={() => setSchedVisible(false)}
        mode={schedMode}
        parent={schedParent}
        onSaved={() => useAppStore.getState().getActiveSchedule()}
      />
    </div>
  );
};

export default ParentsPage;
