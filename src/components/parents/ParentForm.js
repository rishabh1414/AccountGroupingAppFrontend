import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { AutoComplete } from "primereact/autocomplete";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";

import useAppStore from "../../store/useAppStore";

// ---- Theme Options (SB = Sidebar BG, interact-bg = secondary bg, interact-text = text color)
const THEME_VARS = {
  yellow: {
    "--sb-bg": "#000000",
    "--interact-bg": "#facc15",
    "--interact-text": "#0a0a0a",
  },
  green: {
    "--sb-bg": "#0a1f14",
    "--interact-bg": "#22c55e",
    "--interact-text": "#ffffff",
  },
  red: {
    "--sb-bg": "#2a0a0a",
    "--interact-bg": "#ef4444",
    "--interact-text": "#ffffff",
  },
  blue: {
    "--sb-bg": "#0a1525",
    "--interact-bg": "#3b82f6",
    "--interact-text": "#ffffff",
  },
  teal: {
    "--sb-bg": "#0a1f1f",
    "--interact-bg": "#14b8a6",
    "--interact-text": "#ffffff",
  },
  cyan: {
    "--sb-bg": "#0a1f2a",
    "--interact-bg": "#06b6d4",
    "--interact-text": "#ffffff",
  },
  sky: {
    "--sb-bg": "#0a1a2a",
    "--interact-bg": "#38bdf8",
    "--interact-text": "#0a0a0a",
  },
  indigo: {
    "--sb-bg": "#151533",
    "--interact-bg": "#6366f1",
    "--interact-text": "#ffffff",
  },
  purple: {
    "--sb-bg": "#1a0f2d",
    "--interact-bg": "#a855f7",
    "--interact-text": "#ffffff",
  },
  violet: {
    "--sb-bg": "#1a1330",
    "--interact-bg": "#8b5cf6",
    "--interact-text": "#ffffff",
  },
  pink: {
    "--sb-bg": "#2a0f1f",
    "--interact-bg": "#ec4899",
    "--interact-text": "#ffffff",
  },
  rose: {
    "--sb-bg": "#2a0f18",
    "--interact-bg": "#f43f5e",
    "--interact-text": "#ffffff",
  },
  orange: {
    "--sb-bg": "#2a1205",
    "--interact-bg": "#f97316",
    "--interact-text": "#ffffff",
  },
  amber: {
    "--sb-bg": "#1f1505",
    "--interact-bg": "#f59e0b",
    "--interact-text": "#0a0a0a",
  },
  lime: {
    "--sb-bg": "#1a220a",
    "--interact-bg": "#84cc16",
    "--interact-text": "#0a0a0a",
  },
  emerald: {
    "--sb-bg": "#0a1f18",
    "--interact-bg": "#10b981",
    "--interact-text": "#ffffff",
  },
  fuchsia: {
    "--sb-bg": "#240a2a",
    "--interact-bg": "#d946ef",
    "--interact-text": "#ffffff",
  },
  gray: {
    "--sb-bg": "#0f0f0f",
    "--interact-bg": "#9ca3af",
    "--interact-text": "#ffffff",
  },
  slate: {
    "--sb-bg": "#0f172a",
    "--interact-bg": "#64748b",
    "--interact-text": "#ffffff",
  },
  stone: {
    "--sb-bg": "#1c1917",
    "--interact-bg": "#78716c",
    "--interact-text": "#ffffff",
  },
  neutral: {
    "--sb-bg": "#171717",
    "--interact-bg": "#737373",
    "--interact-text": "#ffffff",
  },
  zinc: {
    "--sb-bg": "#18181b",
    "--interact-bg": "#71717a",
    "--interact-text": "#ffffff",
  },
  brown: {
    "--sb-bg": "#1a0f0a",
    "--interact-bg": "#92400e",
    "--interact-text": "#ffffff",
  },
  gold: {
    "--sb-bg": "#1a1405",
    "--interact-bg": "#eab308",
    "--interact-text": "#0a0a0a",
  },
  silver: {
    "--sb-bg": "#1a1a1a",
    "--interact-bg": "#9ca3af",
    "--interact-text": "#000000",
  },
  navy: {
    "--sb-bg": "#0a1120",
    "--interact-bg": "#1e3a8a",
    "--interact-text": "#ffffff",
  },
  maroon: {
    "--sb-bg": "#1a0a0f",
    "--interact-bg": "#991b1b",
    "--interact-text": "#ffffff",
  },
  olive: {
    "--sb-bg": "#1a1f0a",
    "--interact-bg": "#4d7c0f",
    "--interact-text": "#ffffff",
  },
  aqua: {
    "--sb-bg": "#0a1f1f",
    "--interact-bg": "#06b6d4",
    "--interact-text": "#0a0a0a",
  },
};

const themeOptions = Object.keys(THEME_VARS).map((key) => ({
  label: key.charAt(0).toUpperCase() + key.slice(1),
  value: key,
}));

// ---- Custom Value Labels (includes App Theme)
const CUSTOM_VALUE_FIELDS = {
  agencyColor1: "Agency Color 1",
  agencyColor2: "Agency Color 2",
  agencyDarkLogo: "Agency Dark Logo",
  agencyLightLogo: "Agency Light Logo",
  agencyName: "Agency Name",
  agencyPhoneNumber: "Agency Phone Number",
  agencySupportEmail: "Agency Support Email",
  appTheme: "App Theme", // dropdown
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
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    defaultValues,
    mode: "onChange",
  });

  const selectedTheme = watch("customValues.appTheme");

  // Normalize potential existing theme from GHL
  const normalizeThemeKey = (val) => {
    if (!val || typeof val !== "string") return "";
    const k = val.trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(THEME_VARS, k) ? k : "";
  };

  // Pre-fill when editing (show current GHL values if they exist)
  const formattedEditData = useMemo(() => {
    if (!isEditMode) return defaultValues;

    const customValueFields = {};
    // copy whatever keys are present on the parent
    for (const key in editParent.customValues) {
      let raw = editParent.customValues[key]?.value ?? "";
      // normalize appTheme specifically
      if (key === "appTheme") raw = normalizeThemeKey(raw);
      customValueFields[key] = raw;
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
        let changed = false;

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
              // send normalized appTheme key name as plain text
              updates[key] =
                key === "appTheme"
                  ? normalizeThemeKey(data.customValues[key])
                  : data.customValues[key];
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

  // --- Preview helpers
  const renderThemeSwatches = (themeKey) => {
    const t = THEME_VARS[themeKey];
    if (!t) return null;
    return (
      <div
        className="flex gap-2 mt-2 p-2 rounded"
        style={{ border: "1px solid #e5e7eb", justifyContent: "space-around" }}
      >
        <div
          style={{
            backgroundColor: t["--sb-bg"],
            width: "30%",
            height: "40px",
            borderRadius: "4px",
          }}
          title="Sidebar BG"
        />
        <div
          style={{
            backgroundColor: t["--interact-bg"],
            width: "30%",
            height: "40px",
            borderRadius: "4px",
          }}
          title="Interactive BG"
        />
        <div
          style={{
            backgroundColor: t["--interact-text"],
            width: "30%",
            height: "40px",
            borderRadius: "4px",
            border: "1px solid #9ca3af",
          }}
          title="Interactive Text"
        />
      </div>
    );
  };

  const renderThemeGradientBar = (themeKey) => {
    const t = THEME_VARS[themeKey];
    if (!t) return null;
    return (
      <div className="mt-3">
        <div
          style={{
            height: "14px",
            width: "100%",
            borderRadius: "6px",
            background: `linear-gradient(90deg, ${t["--sb-bg"]} 35%, ${t["--interact-bg"]} 65%)`,
            border: "1px solid #e5e7eb",
          }}
          title="Preview Bar (Sidebar → Interactive)"
        />
        <div
          className="flex align-items-center gap-2 mt-2"
          style={{ fontSize: 12 }}
        >
          <span style={{ opacity: 0.7 }}>Theme:</span>
          <strong>{themeKey}</strong>
          <span style={{ opacity: 0.7, marginLeft: "auto" }}>
            Text color sample:
          </span>
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 18,
              borderRadius: 4,
              border: "1px solid #d1d5db",
              background: t["--interact-text"],
            }}
            title="Interactive Text Color"
          />
        </div>
      </div>
    );
  };

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
                    render={({ field }) => {
                      if (key === "appTheme") {
                        return (
                          <>
                            <Dropdown
                              id={field.name}
                              value={field.value}
                              options={themeOptions}
                              onChange={(e) =>
                                field.onChange(normalizeThemeKey(e.value))
                              }
                              filter
                              placeholder="Select App Theme"
                              className="w-full"
                              disabled={isSubmitting}
                            />
                            {field.value && renderThemeSwatches(field.value)}
                          </>
                        );
                      }
                      return (
                        <InputText
                          id={field.name}
                          {...field}
                          placeholder={`Enter ${getFieldLabel(key)}`}
                          disabled={isSubmitting}
                        />
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Persistent preview at the end of the form */}
        {selectedTheme && (
          <div className="mt-3">
            <h5 className="mt-0 mb-2">Theme Preview</h5>
            {renderThemeGradientBar(selectedTheme)}
          </div>
        )}
      </form>
    </Dialog>
  );
};

export default ParentForm;
