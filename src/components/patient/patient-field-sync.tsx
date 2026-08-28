"use client";

import { useEffect, useRef } from "react";
import { useWatch, type Control } from "react-hook-form";

import type { PatientSyncResult } from "@/hooks/use-patient-sync";
import type { PatientFormData } from "@/types";

type PatientFieldSyncProps<K extends keyof PatientFormData> = {
  control: Control<PatientFormData>;
  name: K;
  patchField: PatientSyncResult["patchField"];
};

function PatientFieldSync<K extends keyof PatientFormData>({
  control,
  name,
  patchField,
}: PatientFieldSyncProps<K>) {
  const value = useWatch({ control, name });
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (Object.is(previousValueRef.current, value)) {
      return;
    }

    previousValueRef.current = value;
    patchField(name, value as PatientFormData[K]);
  }, [name, patchField, value]);

  return null;
}

export function PatientFormBroadcaster({
  control,
  patchField,
}: {
  control: Control<PatientFormData>;
  patchField: PatientSyncResult["patchField"];
}) {
  return (
    <>
      <PatientFieldSync control={control} name="firstName" patchField={patchField} />
      <PatientFieldSync control={control} name="middleName" patchField={patchField} />
      <PatientFieldSync control={control} name="lastName" patchField={patchField} />
      <PatientFieldSync control={control} name="dateOfBirth" patchField={patchField} />
      <PatientFieldSync control={control} name="gender" patchField={patchField} />
      <PatientFieldSync control={control} name="phoneNumber" patchField={patchField} />
      <PatientFieldSync control={control} name="email" patchField={patchField} />
      <PatientFieldSync control={control} name="address" patchField={patchField} />
      <PatientFieldSync
        control={control}
        name="preferredLanguage"
        patchField={patchField}
      />
      <PatientFieldSync control={control} name="nationality" patchField={patchField} />
      <PatientFieldSync control={control} name="emergencyContact" patchField={patchField} />
      <PatientFieldSync control={control} name="religion" patchField={patchField} />
    </>
  );
}
