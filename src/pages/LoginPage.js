import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";

import useAppStore from "../store/useAppStore";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { username: "admin", password: "" },
  });

  const onSubmit = async (data) => {
    setError("");
    try {
      await login(data);
      navigate("/parents"); // Redirect to dashboard on successful login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <i className="pi pi-briefcase"></i>
          <h2>Admin Login</h2>
          <p>Sign in to manage your accounts.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
          <div className="field">
            <span className="p-float-label">
              <Controller
                name="username"
                control={control}
                rules={{ required: "Username is required." }}
                render={({ field, fieldState }) => (
                  <InputText
                    id={field.name}
                    {...field}
                    autoFocus
                    className={classNames({ "p-invalid": fieldState.invalid })}
                  />
                )}
              />
              <label
                htmlFor="username"
                className={classNames({ "p-error": errors.username })}
              >
                Username*
              </label>
            </span>
            {errors.username && (
              <small className="p-error">{errors.username.message}</small>
            )}
          </div>

          <div className="field mt-4">
            <span className="p-float-label">
              <Controller
                name="password"
                control={control}
                rules={{ required: "Password is required." }}
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
              <label
                htmlFor="password"
                className={classNames({ "p-error": errors.password })}
              >
                Password*
              </label>
            </span>
            {errors.password && (
              <small className="p-error">{errors.password.message}</small>
            )}
          </div>

          {error && (
            <Message severity="error" text={error} className="mt-3 w-full" />
          )}

          <Button
            type="submit"
            label="Login"
            className="mt-4 w-full"
            loading={isSubmitting}
          />
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
