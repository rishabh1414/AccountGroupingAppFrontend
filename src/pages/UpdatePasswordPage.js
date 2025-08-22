import React, { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";

import useAppStore from "../store/useAppStore";
import PageHeader from "../components/common/PageHeader";
import "./UpdatePasswordPage.css";

const UpdatePasswordPage = () => {
  const toast = useRef(null);
  const { updatePassword } = useAppStore();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      passwordCurrent: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const newPassword = watch("password");

  const onSubmit = async (data) => {
    try {
      await updatePassword(data);
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Password updated successfully!",
        life: 3000,
      });
      reset();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
        life: 3000,
      });
    }
  };

  return (
    <div className="update-password-container">
      <Toast ref={toast} />
      <PageHeader
        title="Update Password"
        subtitle="Change your administrator password."
      />
      <div className="update-password-card">
        <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
          <div className="field">
            <label htmlFor="passwordCurrent">Current Password</label>
            <Controller
              name="passwordCurrent"
              control={control}
              rules={{ required: "Current password is required." }}
              render={({ field, fieldState }) => (
                <Password
                  id={field.name}
                  {...field}
                  toggleMask
                  className={classNames({ "p-invalid": fieldState.invalid })}
                />
              )}
            />
            {errors.passwordCurrent && (
              <small className="p-error">
                {errors.passwordCurrent.message}
              </small>
            )}
          </div>

          <div className="field mt-4">
            <label htmlFor="password">New Password</label>
            <Controller
              name="password"
              control={control}
              rules={{
                required: "New password is required.",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long.",
                },
              }}
              render={({ field, fieldState }) => (
                <Password
                  id={field.name}
                  {...field}
                  toggleMask
                  className={classNames({ "p-invalid": fieldState.invalid })}
                />
              )}
            />
            {errors.password && (
              <small className="p-error">{errors.password.message}</small>
            )}
          </div>

          <div className="field mt-4">
            <label htmlFor="passwordConfirm">Confirm New Password</label>
            <Controller
              name="passwordConfirm"
              control={control}
              rules={{
                required: "Please confirm your new password.",
                validate: (value) =>
                  value === newPassword || "The passwords do not match.",
              }}
              render={({ field, fieldState }) => (
                <Password
                  id={field.name}
                  {...field}
                  toggleMask
                  feedback={false}
                  className={classNames({ "p-invalid": fieldState.invalid })}
                />
              )}
            />
            {errors.passwordConfirm && (
              <small className="p-error">
                {errors.passwordConfirm.message}
              </small>
            )}
          </div>

          <div className="flex justify-content-end mt-4">
            <Button
              type="submit"
              label="Update Password"
              loading={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
