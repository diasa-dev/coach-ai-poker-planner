import { PagePlaceholder } from "@/components/page-placeholder";

export default function MonthlyPage() {
  return (
    <PagePlaceholder
      eyebrow="Ritmo operacional"
      title="Objetivos mensais"
      description="Define alvos mensais para orientar o plano semanal."
      primaryAction="Definir objetivos"
      items={[
        "Grind",
        "Estudo",
        "Review",
        "Desporto",
      ]}
    />
  );
}
