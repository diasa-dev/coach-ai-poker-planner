import Link from "next/link";

export function PersistenceUnavailable({
  featureName,
  className = "ep-page",
}: {
  featureName: string;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="wp-demo-banner">
        <div>
          <strong>Dados reais indisponíveis</strong>
          <span>
            Sessão ativa, mas a ligação Clerk/Convex ainda não autenticou os dados de {featureName}.
          </span>
          <small>Não estamos a mostrar dados demo para uma conta autenticada.</small>
        </div>
        <Link className="ep-button secondary" href="/settings">
          Ver definições
        </Link>
      </div>
    </section>
  );
}
