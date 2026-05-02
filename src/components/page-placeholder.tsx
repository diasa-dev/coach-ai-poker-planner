import Link from "next/link";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction?: string;
  secondaryHref?: string;
  items: string[];
};

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  secondaryHref = "/weekly",
  items,
}: PagePlaceholderProps) {
  return (
    <section className="ep-page">
      <div className="ep-page-header">
        <div>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="ep-page-actions">
          {secondaryAction ? (
            <Link className="ep-button secondary" href={secondaryHref}>
              {secondaryAction}
            </Link>
          ) : null}
          <button className="ep-button primary" type="button">
            {primaryAction}
          </button>
        </div>
      </div>

      <div className="ep-placeholder-grid">
        <article className="ep-panel large">
          <div>
            <span>Base da slice</span>
            <h2>{title}</h2>
            <p>
              Esta área fica reservada para a próxima slice aprovada. A estrutura, navegação e
              hierarquia visual já estão alinhadas com o handoff Uplinea.
            </p>
          </div>
        </article>

        <aside className="ep-panel">
          <span>Inclui depois</span>
          <ul>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
