import { PagePlaceholder } from "@/components/page-placeholder";

export default function StudyPage() {
  return (
    <PagePlaceholder
      eyebrow="Aprendizagem"
      title="Estudo"
      description="Regista sessões de estudo com duração, tipo e qualidade."
      primaryAction="Registar estudo"
      items={[
        "Drills",
        "Hand review",
        "Solver",
        "Aula individual",
      ]}
    />
  );
}
