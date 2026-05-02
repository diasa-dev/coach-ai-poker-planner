import { PagePlaceholder } from "@/components/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      eyebrow="Configuração"
      title="Definições"
      description="Ajusta preferências do produto sem misturar com execução diária."
      primaryAction="Guardar alterações"
      items={[
        "Semana de planeamento",
        "Privacidade do Coach",
        "Preferências de sessão",
        "Conta",
      ]}
    />
  );
}
