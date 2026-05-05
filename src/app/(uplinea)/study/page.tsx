import { StudySection } from "@/components/study-section";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const selectedBlockParam = (await searchParams).weeklyPlanBlockId;
  const selectedWeeklyPlanBlockId = Array.isArray(selectedBlockParam) ? selectedBlockParam[0] : selectedBlockParam;

  return <StudySection selectedWeeklyPlanBlockId={selectedWeeklyPlanBlockId} />;
}
