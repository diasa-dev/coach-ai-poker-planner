"use client";

import { CalendarDays, Check, Download, LockKeyhole, Trash2, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { usePersistenceAuth } from "@/lib/persistence-auth";
import { hasPersistenceConfig } from "@/lib/runtime-config";
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

      <WeekStartSettings />

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

function WeekStartSettings() {
  if (!hasPersistenceConfig) return <WeekStartSettingsLocal />;

  return <PersistedWeekStartSettings />;
}

function PersistedWeekStartSettings() {
  const auth = usePersistenceAuth();
  const canUsePersistence = auth.kind === "ready";
  const weeklyPlan = useQuery(
    api.weeklyPlan.getCurrent,
    canUsePersistence ? { today: new Date().toISOString().slice(0, 10) } : "skip",
  );
  const setWeekStartDay = useMutation(api.weeklyPlan.setWeekStartDay);
  const [draftWeekStartDay, setDraftWeekStartDay] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (auth.kind === "loading" || (canUsePersistence && weeklyPlan === undefined)) {
    return (
      <SettingsPanel title="Planeamento" compact>
        <p className={styles.demoMessage}>A carregar preferências...</p>
      </SettingsPanel>
    );
  }

  const persistedWeekStartDay = weeklyPlan?.weekStartDay ?? 1;
  const selectedWeekStartDay = draftWeekStartDay ?? persistedWeekStartDay;
  const hasChanges = selectedWeekStartDay !== persistedWeekStartDay;
  const canSave = auth.kind === "ready" && hasChanges && saveState !== "saving";

  async function confirmSave() {
    if (!canSave) return;

    setSaveState("saving");
    try {
      await setWeekStartDay({ weekStartDay: selectedWeekStartDay });
      setDraftWeekStartDay(null);
      setShowConfirm(false);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <SettingsPanel title="Planeamento">
      <div className={styles.settingRow}>
        <div className={styles.permissionCopy}>
          <div className={styles.permissionTitle}>
            <CalendarDays size={17} aria-hidden="true" />
            <strong>Início da semana</strong>
          </div>
          <p>Define como o plano semanal é apresentado. A alteração só é aplicada depois de guardares.</p>
        </div>
        <div className={styles.settingControls}>
          <select
            value={selectedWeekStartDay}
            onChange={(event) => {
              setDraftWeekStartDay(Number(event.target.value));
              setSaveState("idle");
            }}
            disabled={auth.kind !== "ready" || saveState === "saving"}
          >
            <WeekStartOptions />
          </select>
          <button
            className={styles.primaryAction}
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={!canSave}
          >
            <Check size={15} aria-hidden="true" />
            <span>{saveState === "saving" ? "A guardar..." : "Guardar"}</span>
          </button>
        </div>
      </div>
      {auth.kind === "signed-out" ? <p className={styles.demoMessage}>Entra para guardar esta preferência.</p> : null}
      {saveState === "saved" ? <p className={styles.demoMessage}>Preferência guardada.</p> : null}
      {saveState === "error" ? <p className={styles.errorMessage}>Não foi possível guardar. Tenta novamente.</p> : null}

      {showConfirm ? (
        <ConfirmDialog
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => void confirmSave()}
          saving={saveState === "saving"}
          selectedLabel={getWeekStartLabel(selectedWeekStartDay)}
        />
      ) : null}
    </SettingsPanel>
  );
}

function WeekStartSettingsLocal() {
  const [draftWeekStartDay, setDraftWeekStartDay] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savedLabel, setSavedLabel] = useState("");

  return (
    <SettingsPanel title="Planeamento">
      <div className={styles.settingRow}>
        <div className={styles.permissionCopy}>
          <div className={styles.permissionTitle}>
            <CalendarDays size={17} aria-hidden="true" />
            <strong>Início da semana</strong>
          </div>
          <p>Modo demo: podes simular a alteração, mas ela não fica persistida.</p>
        </div>
        <div className={styles.settingControls}>
          <select value={draftWeekStartDay} onChange={(event) => setDraftWeekStartDay(Number(event.target.value))}>
            <WeekStartOptions />
          </select>
          <button className={styles.primaryAction} type="button" onClick={() => setShowConfirm(true)}>
            <Check size={15} aria-hidden="true" />
            <span>Guardar</span>
          </button>
        </div>
      </div>
      {savedLabel ? <p className={styles.demoMessage}>Demo local: início da semana definido para {savedLabel}.</p> : null}
      {showConfirm ? (
        <ConfirmDialog
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setSavedLabel(getWeekStartLabel(draftWeekStartDay));
            setShowConfirm(false);
          }}
          selectedLabel={getWeekStartLabel(draftWeekStartDay)}
        />
      ) : null}
    </SettingsPanel>
  );
}

function WeekStartOptions() {
  return (
    <>
      <option value={1}>Segunda</option>
      <option value={2}>Terça</option>
      <option value={3}>Quarta</option>
      <option value={4}>Quinta</option>
      <option value={5}>Sexta</option>
      <option value={6}>Sábado</option>
      <option value={0}>Domingo</option>
    </>
  );
}

function ConfirmDialog({
  onCancel,
  onConfirm,
  saving = false,
  selectedLabel,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saving?: boolean;
  selectedLabel: string;
}) {
  return (
    <div className={styles.modalLayer} role="presentation">
      <button className={styles.modalScrim} type="button" aria-label="Fechar confirmação" onClick={onCancel} />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="week-start-confirm-title">
        <header>
          <div>
            <span>Confirmar alteração</span>
            <h2 id="week-start-confirm-title">Alterar início da semana?</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onCancel}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <p>
          A semana vai passar a começar em {selectedLabel}. Isto afecta a forma como o plano semanal é apresentado e
          recalculado.
        </p>
        <footer>
          <button className={styles.secondaryAction} type="button" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button className={styles.primaryAction} type="button" onClick={onConfirm} disabled={saving}>
            <Check size={15} aria-hidden="true" />
            <span>{saving ? "A guardar..." : "Confirmar e guardar"}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

function getWeekStartLabel(value: number) {
  return {
    0: "Domingo",
    1: "Segunda",
    2: "Terça",
    3: "Quarta",
    4: "Quinta",
    5: "Sexta",
    6: "Sábado",
  }[value] ?? "Segunda";
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
