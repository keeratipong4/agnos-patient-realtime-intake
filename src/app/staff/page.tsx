import { InvalidSession } from "@/components/common/invalid-session";
import { StaffMonitor } from "@/components/staff/staff-monitor";
import { getSessionId } from "@/lib/session";

type StaffPageProps = {
  searchParams: Promise<{
    session?: string | string[];
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const sessionId = getSessionId((await searchParams).session);

  if (!sessionId) {
    return <InvalidSession role="Staff" />;
  }

  return <StaffMonitor sessionId={sessionId} />;
}
