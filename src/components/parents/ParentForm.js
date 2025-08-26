import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { AutoComplete } from "primereact/autocomplete";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";

import useAppStore from "../../store/useAppStore";

// ---- Custom Value Labels (now 8, includes App Theme)
const CUSTOM_VALUE_FIELDS = {
  agencyColor1: "Agency Color 1",
  agencyColor2: "Agency Color 2",
  agencyDarkLogo: "Agency Dark Logo",
  agencyLightLogo: "Agency Light Logo",
  agencyName: "Agency Name",
  agencyPhoneNumber: "Agency Phone Number",
  agencySupportEmail: "Agency Support Email",
  appTheme: "App Theme", // NEW
};

// Default form values
const defaultValues = {
  ghlLocation: null,
  alias: "",
  customValues: Object.keys(CUSTOM_VALUE_FIELDS).reduce((acc, key) => {
    acc[key] = "";
    return acc;
  }, {}),
};

const ParentForm = ({ isVisible, onHide, editParent }) => {
  const {
    addParent,
    updateParent,
    updateParentCustomValues, // <- make sure this exists in your store
    searchGhlLocations,
  } = useAppStore();

  const [ghlSuggestions, setGhlSuggestions] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const isEditMode = Boolean(editParent);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    defaultValues,
    mode: "onChange",
  });

  // Pre-fill when editing
  const formattedEditData = useMemo(() => {
    if (!isEditMode) return defaultValues;
    const customValueFields = {};
    // copy whatever keys are present on the parent (including appTheme)
    for (const key in editParent.customValues) {
      customValueFields[key] = editParent.customValues[key]?.value || "";
    }
    // ensure all declared keys exist so inputs render
    for (const key of Object.keys(CUSTOM_VALUE_FIELDS)) {
      if (!(key in customValueFields)) customValueFields[key] = "";
    }
    return {
      ghlLocation: { name: editParent.name, id: editParent.locationId },
      alias: editParent.alias || "",
      customValues: customValueFields,
    };
  }, [isEditMode, editParent]);

  useEffect(() => {
    if (isVisible) {
      reset(formattedEditData);
      setSubmitError("");
      setSuccessMessage("");
    }
  }, [isVisible, formattedEditData, reset]);

  const handleGhlSearch = async (e) => {
    const q = e.query?.trim();
    if (!q || q.length < 3) {
      setGhlSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const suggestions = await searchGhlLocations(q);
      setGhlSuggestions(suggestions || []);
    } catch {
      setGhlSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitError("");
    setSuccessMessage("");

    try {
      if (isEditMode) {
        // -----------------------
        // EDIT FLOW
        // -----------------------
        let changed = false; // <-- this fixes "changed is not defined"

        // 1) Alias update (if changed)
        if (dirtyFields.alias) {
          await updateParent(editParent._id, { alias: data.alias.trim() });
          changed = true;
        }

        // 2) Custom values update (send only changed keys)
        if (dirtyFields.customValues) {
          const updates = {};
          for (const key in dirtyFields.customValues) {
            if (dirtyFields.customValues[key]) {
              updates[key] = data.customValues[key];
            }
          }
          if (Object.keys(updates).length > 0) {
            // This hits PATCH /api/custom-values/parent/:id and propagates to children + GHL
            await updateParentCustomValues(editParent._id, updates);
            changed = true;
          }
        }

        setSuccessMessage(
          changed ? "Parent updated successfully!" : "No changes were made."
        );
      } else {
        // -----------------------
        // CREATE FLOW
        // -----------------------
        await addParent({
          name: data.ghlLocation.name,
          locationId: data.ghlLocation.id,
          alias: data.alias.trim(),
        });
        onHide(); // Close after creation
      }
    } catch (err) {
      console.error("Form submission failed:", err);
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "An unexpected error occurred."
      );
    }
  };

  const handleDialogHide = () => {
    setSubmitError("");
    setSuccessMessage("");
    setGhlSuggestions([]);
    onHide();
  };

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={handleDialogHide}
        className="p-button-text"
        disabled={isSubmitting}
      />
      <Button
        label={isEditMode ? "Save Changes" : "Add Parent"}
        icon="pi pi-check"
        type="submit"
        form="parent-form"
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </div>
  );

  const getFieldLabel = (key) =>
    CUSTOM_VALUE_FIELDS[key] || key.replace(/([A-Z])/g, " $1");

  return (
    <Dialog
      header={isEditMode ? "Edit Parent Account" : "Add New Parent"}
      visible={isVisible}
      style={{ width: "90vw", maxWidth: "800px" }}
      onHide={handleDialogHide}
      footer={dialogFooter}
      modal
      closable={!isSubmitting}
    >
      {submitError && (
        <Message severity="error" text={submitError} className="mb-3" />
      )}
      {successMessage && (
        <Message severity="success" text={successMessage} className="mb-3" />
      )}
      <form
        id="parent-form"
        onSubmit={handleSubmit(onSubmit)}
        className="p-fluid"
      >
        {!isEditMode && (
          <div className="field">
            <label
              htmlFor="ghlLocation"
              className={classNames({ "p-error": errors.ghlLocation })}
            >
              CLINGY Location*
            </label>
            <Controller
              name="ghlLocation"
              control={control}
              rules={{ required: "CLINGY Location is required." }}
              render={({ field }) => (
                <AutoComplete
                  id={field.name}
                  value={field.value}
                  suggestions={ghlSuggestions}
                  completeMethod={handleGhlSearch}
                  field="name"
                  onChange={(e) => field.onChange(e.value)}
                  dropdown
                  placeholder="Search for CLINGY location..."
                  className={classNames({ "p-invalid": errors.ghlLocation })}
                  disabled={isSubmitting}
                />
              )}
            />
            {errors.ghlLocation && (
              <small className="p-error">{errors.ghlLocation.message}</small>
            )}
          </div>
        )}

        <div className="field">
          <label htmlFor="alias">Display Alias</label>
          <Controller
            name="alias"
            control={control}
            render={({ field }) => (
              <InputText
                id={field.name}
                {...field}
                placeholder="Optional custom display name"
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        {isEditMode && (
          <>
            <h4 className="font-semibold">Custom Values</h4>
            <div className="grid formgrid">
              {Object.keys(CUSTOM_VALUE_FIELDS).map((key) => (
                <div className="field col-12 md:col-6" key={key}>
                  <label htmlFor={`customValues.${key}`}>
                    {getFieldLabel(key)}
                  </label>
                  <Controller
                    name={`customValues.${key}`}
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id={field.name}
                        {...field}
                        placeholder={`Enter ${getFieldLabel(key)}`}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
};

export default ParentForm;
