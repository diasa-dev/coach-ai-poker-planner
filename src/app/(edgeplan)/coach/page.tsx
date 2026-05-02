import { PagePlaceholder } from "@/components/page-placeholder";

export default function CoachPage() {
  return (
    <PagePlaceholder
      eyebrow="Assistente de performance"
      title="Coach AI"
      description="Usa contexto do plano, sessões e reviews para sugerir ajustes práticos."
      primaryAction="Perguntar ao Coach"
      items={[
        "Contexto usado",
        "Sugestões editáveis",
        "Propostas com confirmação",
        "Sem análise técnica de mãos",
      ]}
    />
  );
}
