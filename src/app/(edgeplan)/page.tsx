import { PagePlaceholder } from "@/components/page-placeholder";

export default function TodayPage() {
  return (
    <PagePlaceholder
      eyebrow="Execução diária"
      title="Hoje"
      description="Transforma o plano semanal em compromissos práticos para o dia."
      primaryAction="Preparar dia"
      secondaryAction="Ver plano semanal"
      secondaryHref="/weekly"
      items={[
        "Compromissos de hoje",
        "Blocos planeados",
        "Estado da sessão",
        "Insight compacto do Coach",
      ]}
    />
  );
}
