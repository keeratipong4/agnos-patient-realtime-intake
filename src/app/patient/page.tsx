import { InvalidSession } from "@/components/common/invalid-session";
import { PatientVerticalSlice } from "@/components/patient/patient-vertical-slice";
import { getSessionId } from "@/lib/session";

type PatientPageProps = {
  searchParams: Promise<{
    session?: string | string[];
  }>;
};

export default async function PatientPage({ searchParams }: PatientPageProps) {
  const sessionId = getSessionId((await searchParams).session);

  if (!sessionId) {
    return <InvalidSession role="Patient" />;
  }

  return <PatientVerticalSlice sessionId={sessionId} />;
}
