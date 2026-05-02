import { PagePlaceholder } from "@/components/page-placeholder";

export default function ReviewPage() {
  return (
    <PagePlaceholder
      eyebrow="Fechar o ciclo"
      title="Revisão"
      description="Revê execução, energia, foco e ajustes antes do próximo plano."
      primaryAction="Fazer revisão semanal"
      items={[
        "Plano vs realidade",
        "Razões de ajustes",
        "Reflexão do jogador",
        "Sugestão do Coach",
      ]}
    />
  );
}
