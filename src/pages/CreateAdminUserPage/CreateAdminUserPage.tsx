import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Navigate } from "react-router-dom";

import { createAppUser } from "../../api";
import { useSetupStore } from "../../store";
import { getErrorMessage } from "../../utils";
import {
  createAdminUserSchema,
  type CreateAdminUserFormValues,
} from "../../validation";

import { Card, Button, Input, Alert, StepIndicator } from "../../components/ui";
import { PageShell } from "../../components/layout";

const SETUP_STEPS = ["Create Studio", "Create Admin", "Dashboard"];

export function CreateAdminUserPage() {
  const navigate = useNavigate();
  const studio = useSetupStore((s) => s.studio);
  const setAdminUser = useSetupStore((s) => s.setAdminUser);
  const completeSetup = useSetupStore((s) => s.completeSetup);
  const [serverError, setServerError] = useState<string | null>(null);

  // Guard: must have a studio before creating a user
  if (!studio) {
    return <Navigate to="/setup/studio" replace />;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAdminUserFormValues>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: createAppUser,
    onSuccess: (user) => {
      setAdminUser(user);
      completeSetup();
      navigate("/dashboard");
    },
    onError: (error: unknown) => {
      setServerError(getErrorMessage(error));
    },
  });

  const onSubmit = (values: CreateAdminUserFormValues) => {
    setServerError(null);
    mutation.mutate({
      studioId: studio.id,
      email: values.email,
      password: values.password,
      role: "ADMIN",
    });
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-lg">
        <StepIndicator steps={SETUP_STEPS} currentStep={1} />

        <Card>
          <h2 className="mb-1 text-xl font-bold text-gray-900">
            Create Admin Account
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            This account will manage{" "}
            <span className="font-semibold text-gray-700">{studio.name}</span>.
          </p>

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
              label="Admin email"
              type="email"
              placeholder="admin@example.com"
              autoFocus
              {...register("email")}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              {...register("password")}
              error={errors.password?.message}
            />

            <Button type="submit" isLoading={mutation.isPending}>
              Create Admin User
            </Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
