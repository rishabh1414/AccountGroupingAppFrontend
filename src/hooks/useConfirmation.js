import React, { useState } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";

/**
 * A custom hook to simplify using PrimeReact's ConfirmDialog.
 * This hook returns a tuple:
 * 1. The ConfirmationDialog component to be rendered in your page.
 * 2. The `confirm` function to be called to trigger the dialog.
 * * @returns {[() => JSX.Element, (options: object) => void]}
 */
const useConfirmation = () => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState({});

  /**
   * Triggers the confirmation dialog with custom options.
   * @param {object} opts - Options for the dialog (header, message, accept, reject, etc.).
   */
  const confirm = (opts) => {
    setOptions({
      // Default options
      message: "Are you sure you want to proceed?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      // Override with user-provided options
      ...opts,
      // Wrap accept/reject to ensure the dialog is hidden
      accept: () => {
        if (opts.accept) opts.accept();
        setVisible(false);
      },
      reject: () => {
        if (opts.reject) opts.reject();
        setVisible(false);
      },
    });
    setVisible(true);
  };

  // This is the actual component that gets rendered.
  // It's state (visibility, content) is controlled by the hook.
  const ConfirmationDialogComponent = () => (
    <ConfirmDialog
      visible={visible}
      onHide={() => setVisible(false)}
      message={options.message}
      header={options.header}
      icon={options.icon}
      accept={options.accept}
      reject={options.reject}
      acceptClassName={options.acceptClassName}
      rejectClassName={options.rejectClassName}
    />
  );

  return [ConfirmationDialogComponent, confirm];
};

export default useConfirmation;
