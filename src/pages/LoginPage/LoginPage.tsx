import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Navigate } from "react-router-dom";

import { login } from "../../api";
import { useAuthStore } from "../../store";
import { getErrorMessage } from "../../utils";
import { loginSchema, type LoginFormValues } from "../../validation";

import { Card, Button, Input, Alert } from "../../components/ui";
import { PageShell } from "../../components/layout";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login: storeLogin } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  // Already logged in → redirect away
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      storeLogin(response.accessToken, response.user);

      // Route based on role
      if (response.user.role === "ADMIN") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/agenda", { replace: true });
      }
    },
    onError: (error: unknown) => {
      setServerError(getErrorMessage(error));
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    setServerError(null);
    mutation.mutate(values);
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-sm pt-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your Prenota24 account
          </p>
        </div>

        <Card>
          {serverError && (
            <div className="mb-4">
              <Alert
                variant="error"
                message={serverError}
                onDismiss={() => setServerError(null)}
              />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoFocus
              autoComplete="email"
              {...register("email")}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              error={errors.password?.message}
            />

            <Button type="submit" isLoading={mutation.isPending}>
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
