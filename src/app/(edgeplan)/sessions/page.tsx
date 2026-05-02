import { PagePlaceholder } from "@/components/page-placeholder";

export default function SessionsPage() {
  return (
    <PagePlaceholder
      eyebrow="Grind com contexto"
      title="Sessões"
      description="Inicia, acompanha e fecha sessões sem transformar a app num tracker financeiro."
      primaryAction="Iniciar sessão"
      items={[
        "Sessão ativa ou pendente",
        "Histórico compacto",
        "Mãos para rever",
        "Review curta pós-sessão",
      ]}
    />
  );
}
