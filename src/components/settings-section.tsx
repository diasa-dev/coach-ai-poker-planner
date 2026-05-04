"use client";

import { Download, LockKeyhole, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import styles from "./settings-section.module.css";

type Permission = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

const coachPermissions: Permission[] = [
  {
    id: "planning",
    title: "Plano semanal e mensal",
    description: "Foco, blocos planeados e ajustes da semana.",
    enabled: true,
  },
  {
    id: "sessions",
    title: "Dados de sessão",
    description: "Foco, duração, número de torneios, qualidade.",
    enabled: true,
  },
  {
    id: "study",
    title: "Registos de estudo",
    description: "Tipo, duração, qualidade. Necessário para detetar padrões.",
    enabled: true,
  },
  {
    id: "reviews",
    title: "Reviews semanais",
    description: "Reflexão escrita, ratings. Usado pelo Coach com cuidado.",
    enabled: true,
  },
  {
    id: "energy",
    title: "Energia / foco / tilt",
    description: "Check-ups durante a sessão. Sensível, usado para alertas.",
    enabled: true,
  },
  {
    id: "hands",
    title: "Mãos marcadas",
    description: "Templates e notas das mãos para revisão.",
    enabled: true,
  },
];

const sensitiveData: Permission[] = [
  {
    id: "financial",
    title: "Resultado financeiro",
    description:
      "Opcional, secundário. Nunca aparece em painéis nem em gráficos. Só é incluído no contexto do Coach quando autorizado em cada sessão.",
    enabled: false,
  },
];

export function SettingsSection() {
  const [permissions, setPermissions] = useState(coachPermissions);
  const [sensitive, setSensitive] = useState(sensitiveData);
  const [demoMessage, setDemoMessage] = useState("");

  function togglePermission(id: string) {
    setPermissions((current) =>
      current.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    );
  }

  function toggleSensitive(id: string) {
    setSensitive((current) =>
      current.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    );
  }

  function showDemoMessage(action: "export" | "delete") {
    setDemoMessage(
      action === "export"
        ? "Demo local: a exportação ainda não gera ficheiros."
        : "Demo local: nenhuma conta será apagada.",
    );
  }

  return (
    <section className={styles.settingsPage}>
      <header className={styles.header}>
        <span>Definições</span>
        <h1>Privacidade</h1>
        <p>Controla, por tipo de dados, o que o Coach pode usar como contexto.</p>
      </header>

      <SettingsPanel title="Permissões para o Coach">
        <div className={styles.permissionList}>
          {permissions.map((permission) => (
            <PermissionRow
              description={permission.description}
              enabled={permission.enabled}
              key={permission.id}
              onToggle={() => togglePermission(permission.id)}
              title={permission.title}
            />
          ))}
        </div>
      </SettingsPanel>

      <SettingsPanel title="Dados sensíveis">
        <div className={styles.permissionList}>
          {sensitive.map((permission) => (
            <PermissionRow
              description={permission.description}
              enabled={permission.enabled}
              icon={<LockKeyhole size={17} aria-hidden="true" />}
              key={permission.id}
              onToggle={() => toggleSensitive(permission.id)}
              title={permission.title}
            />
          ))}
        </div>
      </SettingsPanel>

      <SettingsPanel title="Exportar e apagar" compact>
        <div className={styles.actionRow}>
          <button className={styles.secondaryAction} type="button" onClick={() => showDemoMessage("export")}>
            <Download size={17} aria-hidden="true" />
            <span>Exportar dados (JSON)</span>
          </button>
          <button className={styles.secondaryAction} type="button" onClick={() => showDemoMessage("delete")}>
            <Trash2 size={17} aria-hidden="true" />
            <span>Apagar conta</span>
          </button>
        </div>
        {demoMessage ? <p className={styles.demoMessage}>{demoMessage}</p> : null}
      </SettingsPanel>
    </section>
  );
}

function SettingsPanel({
  children,
  compact = false,
  title,
}: {
  children: ReactNode;
  compact?: boolean;
  title: string;
}) {
  return (
    <article className={compact ? `${styles.panel} ${styles.compactPanel}` : styles.panel}>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function PermissionRow({
  description,
  enabled,
  icon,
  onToggle,
  title,
}: {
  description: string;
  enabled: boolean;
  icon?: ReactNode;
  onToggle: () => void;
  title: string;
}) {
  return (
    <div className={styles.permissionRow}>
      <div className={styles.permissionCopy}>
        <div className={styles.permissionTitle}>
          {icon}
          <strong>{title}</strong>
        </div>
        <p>{description}</p>
      </div>
      <button
        aria-checked={enabled}
        aria-label={`${enabled ? "Desativar" : "Ativar"} ${title}`}
        className={enabled ? `${styles.toggle} ${styles.toggleOn}` : styles.toggle}
        onClick={onToggle}
        role="switch"
        type="button"
      >
        <span />
      </button>
    </div>
  );
}
