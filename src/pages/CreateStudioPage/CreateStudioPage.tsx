import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createStudio } from "../../api";
import { useSetupStore } from "../../store";
import { getErrorMessage } from "../../utils";
import {
  createStudioSchema,
  type CreateStudioFormValues,
} from "../../validation";

import { Card, Button, Input, Alert, StepIndicator } from "../../components/ui";
import { PageShell } from "../../components/layout";

const SETUP_STEPS = ["Create Studio", "Create Admin", "Dashboard"];

export function CreateStudioPage() {
  const navigate = useNavigate();
  const setStudio = useSetupStore((s) => s.setStudio);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStudioFormValues>({
    resolver: zodResolver(createStudioSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const mutation = useMutation({
    mutationFn: createStudio,
    onSuccess: (studio) => {
      setStudio(studio);
      navigate("/setup/admin");
    },
    onError: (error: unknown) => {
      setServerError(getErrorMessage(error));
    },
  });

  const onSubmit = (values: CreateStudioFormValues) => {
    setServerError(null);
    mutation.mutate({
      name: values.name,
      email: values.email,
      phone: values.phone,
    });
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-lg">
        <StepIndicator steps={SETUP_STEPS} currentStep={0} />

        <Card>
          <h2 className="mb-1 text-xl font-bold text-gray-900">
            Create your Studio
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            A Studio is your workspace. All professionals and appointments belong
            to it.
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
              label="Studio name"
              placeholder="e.g. Studio Medico Rossi"
              autoFocus
              {...register("name")}
              error={errors.name?.message}
            />

            <Input
              label="Email (optional)"
              type="email"
              placeholder="studio@example.com"
              {...register("email")}
              error={errors.email?.message}
            />

            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+39 02 1234567"
              {...register("phone")}
              error={errors.phone?.message}
            />

            <Button type="submit" isLoading={mutation.isPending}>
              Create Studio
            </Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
