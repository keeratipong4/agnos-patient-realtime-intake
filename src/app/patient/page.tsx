import { InvalidSession } from "@/components/common/invalid-session";
import { PatientForm } from "@/components/patient/patient-form";
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

  return <PatientForm key={sessionId} sessionId={sessionId} />;
}
