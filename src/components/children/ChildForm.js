import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { AutoComplete } from "primereact/autocomplete";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import useAppStore from "../../store/useAppStore";
import "./ChildForm.css"; // --- NEW: Import the new CSS file ---

const defaultValues = {
  ghlLocation: null,
  alias: "",
  parentId: null,
};

const ChildForm = ({ isVisible, onHide, editChild, preselectedParent }) => {
  const { parents, addChild, updateChild, searchGhlLocations } = useAppStore();
  const [ghlSuggestions, setGhlSuggestions] = useState([]);
  const isEditMode = !!editChild;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  useEffect(() => {
    if (!isVisible) return;
    if (isEditMode && editChild) {
      reset({
        ghlLocation: { name: editChild.name, id: editChild.locationId },
        alias: editChild.alias || "",
        parentId: editChild.parentId?._id || null,
      });
    } else if (preselectedParent) {
      reset({ ...defaultValues, parentId: preselectedParent._id });
    } else {
      reset(defaultValues);
    }
  }, [isVisible, isEditMode, editChild, preselectedParent, reset]);

  const handleGhlSearch = async (e) => {
    const q = e.query?.trim();
    if (q && q.length >= 3) {
      const suggestions = await searchGhlLocations(q);
      setGhlSuggestions(suggestions || []);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        alias: (data.alias || "").trim(),
        parentId: data.parentId,
      };

      if (isEditMode) {
        await updateChild(editChild._id, payload);
      } else {
        if (
          !data.ghlLocation ||
          !data.ghlLocation.id ||
          !data.ghlLocation.name
        ) {
          console.error(
            "Invalid GHL Location data submitted. Submission blocked.",
            data.ghlLocation
          );
          return;
        }
        payload.name = data.ghlLocation.name;
        payload.locationId = data.ghlLocation.id;
        await addChild(payload);
      }
      onHide();
    } catch (err) {
      console.error("Child form submission failed:", err);
    }
  };

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-text"
        disabled={isSubmitting}
      />
      <Button
        label={isEditMode ? "Save Changes" : "Add PLEC"}
        icon="pi pi-check"
        type="submit"
        form="child-form"
        loading={isSubmitting ? true : undefined}
        disabled={isSubmitting}
      />
    </div>
  );

  return (
    <Dialog
      header={isEditMode ? "Edit or Transfer PLEC" : "Add New PLEC"}
      visible={isVisible}
      // --- KEY CHANGE: Removed inline style, added a class for external CSS ---
      className="child-form-dialog"
      onHide={onHide}
      footer={dialogFooter}
      modal
      blockScroll
    >
      <form
        id="child-form"
        className="p-fluid"
        onSubmit={handleSubmit(onSubmit)}
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
                  inputId={field.name}
                  value={field.value}
                  suggestions={ghlSuggestions}
                  completeMethod={handleGhlSearch}
                  field="name"
                  itemTemplate={(item) => (
                    <div>
                      <div>{item.name}</div>
                      <small className="text-gray-500">{item.address}</small>
                    </div>
                  )}
                  onChange={(e) => field.onChange(e.value)}
                  dropdown
                  forceSelection
                  className={classNames({ "p-invalid": errors.ghlLocation })}
                />
              )}
            />
            {errors.ghlLocation && (
              <small className="p-error">{errors.ghlLocation.message}</small>
            )}
          </div>
        )}

        <div className="field">
          <label
            htmlFor="parentId"
            className={classNames({ "p-error": errors.parentId })}
          >
            TechBizCEO Account*
          </label>
          <Controller
            name="parentId"
            control={control}
            rules={{ required: "TechBizCEO Account is required." }}
            render={({ field }) => (
              <Dropdown
                inputId={field.name}
                value={field.value}
                options={parents}
                onChange={(e) => field.onChange(e.value)}
                optionLabel="name"
                optionValue="_id"
                placeholder="Select a TechBizCEO Account"
                filter
                disabled={isEditMode ? false : !!preselectedParent}
                className={classNames({ "p-invalid": errors.parentId })}
              />
            )}
          />
          {errors.parentId && (
            <small className="p-error">{errors.parentId.message}</small>
          )}
        </div>

        <div className="field">
          <label htmlFor="alias">Display Alias (Optional)</label>
          <Controller
            name="alias"
            control={control}
            render={({ field }) => (
              <InputText
                id={field.name}
                {...field}
                placeholder="Enter a short display name"
              />
            )}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default ChildForm;
