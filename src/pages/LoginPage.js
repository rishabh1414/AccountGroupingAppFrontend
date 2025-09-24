import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Checkbox } from "primereact/checkbox";
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
    defaultValues: { username: "", password: "", remember: true },
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    setError("");
    try {
      await login({ username: data.username, password: data.password });
      navigate("/tech-biz-ceos", { replace: true });
    } catch (err) {
      setError(err?.message || "Invalid credentials.");
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card-2col" role="dialog" aria-labelledby="lp-title">
        {/* LEFT HERO */}
        <section className="lp-hero" aria-hidden="true">
          <div className="lp-hero-inner">
            <h1 id="lp-title">Smart Grouping, Smarter Growth</h1>
            <p>
              Organize TechBiz leaders and client brands effortlessly with one
              secure hub.
            </p>
            <div className="lp-dots" />
          </div>
        </section>

        {/* RIGHT FORM */}
        <section className="lp-form">
          <h2 className="lp-form-title">Sign In</h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-fluid"
            noValidate
          >
            {/* Username */}
            <div className="field">
              <div className="p-inputgroup lp-inputgroup">
                <span className="p-inputgroup-addon lp-addon">
                  <i className="pi pi-user" aria-hidden="true" />
                </span>
                <Controller
                  name="username"
                  control={control}
                  rules={{ required: "Username or email is required." }}
                  render={({ field, fieldState }) => (
                    <InputText
                      id="username"
                      placeholder="Username or email"
                      autoComplete="username"
                      {...field}
                      className={classNames({
                        "p-invalid": fieldState.invalid,
                      })}
                    />
                  )}
                />
              </div>
              {errors.username && (
                <small className="p-error">{errors.username.message}</small>
              )}
            </div>

            {/* Password */}
            <div className="field">
              <div className="p-inputgroup lp-inputgroup">
                <span className="p-inputgroup-addon lp-addon">
                  <i className="pi pi-lock" aria-hidden="true" />
                </span>
                <Controller
                  name="password"
                  control={control}
                  rules={{ required: "Password is required." }}
                  render={({ field, fieldState }) => (
                    <Password
                      id="password"
                      placeholder="Password"
                      toggleMask
                      feedback={false}
                      inputClassName={classNames({
                        "p-invalid": fieldState.invalid,
                      })}
                      {...field}
                    />
                  )}
                />
              </div>
              {errors.password && (
                <small className="p-error">{errors.password.message}</small>
              )}
            </div>

            {/* Remember only (no forgot) */}
            <div className="lp-row-start">
              <Controller
                name="remember"
                control={control}
                render={({ field }) => (
                  <div className="p-field-checkbox">
                    <Checkbox
                      inputId="remember"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                    />
                    <label htmlFor="remember">Remember me</label>
                  </div>
                )}
              />
            </div>

            {error && (
              <Message severity="error" text={error} className="w-full mb-2" />
            )}

            <Button
              type="submit"
              label="Sign In"
              className="lp-submit"
              loading={isSubmitting}
            />
          </form>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
