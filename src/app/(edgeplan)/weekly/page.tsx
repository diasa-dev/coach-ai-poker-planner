import { PagePlaceholder } from "@/components/page-placeholder";

export default function WeeklyPage() {
  return (
    <PagePlaceholder
      eyebrow="Centro de execução"
      title="Plano semanal"
      description="Planeia a semana em blocos compactos antes de executar o dia."
      primaryAction="Planear semana"
      secondaryAction="Adicionar bloco"
      items={[
        "Foco semanal",
        "Grelha de sete dias",
        "Blocos por categoria",
        "Resumo de distribuição semanal",
      ]}
    />
  );
}
