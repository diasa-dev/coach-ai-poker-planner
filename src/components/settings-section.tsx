"use client";

import { CalendarDays, Check, Download, LockKeyhole, Plus, Trash2, X } from "lucide-react";
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

const defaultHandReviewTemplates = [
  "Geral",
  "Pote grande",
  "ICM",
  "Bluff catch",
  "All-in marginal",
  "River difícil",
  "Exploit / read",
  "Erro emocional",
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

      <HandReviewSettings />

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

      <PlanningResetPanel />
    </section>
  );
}

function PlanningResetPanel() {
  if (!hasPersistenceConfig) {
    return (
      <SettingsPanel title="Reset de testes" compact>
        <p className={styles.demoMessage}>Modo demo: entra numa conta para apagar dados guardados.</p>
      </SettingsPanel>
    );
  }

  return <PersistedPlanningResetPanel />;
}

function PersistedPlanningResetPanel() {
  const auth = usePersistenceAuth();
  const clearPlanningData = useMutation(api.planningReset.clearPlanningData);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetState, setResetState] = useState<"idle" | "deleting" | "deleted" | "error">("idle");
  const [summary, setSummary] = useState<Record<string, number> | null>(null);

  const canReset = auth.kind === "ready" && resetState !== "deleting";

  async function confirmReset() {
    if (!canReset) return;

    setResetState("deleting");
    try {
      const result = await clearPlanningData({});
      setSummary(result);
      setShowConfirm(false);
      setResetState("deleted");
    } catch {
      setResetState("error");
    }
  }

  const deletedCount = summary
    ? Object.values(summary).reduce((total, value) => total + value, 0)
    : 0;

  return (
    <SettingsPanel title="Reset de testes" compact>
      <div className={styles.dangerRow}>
        <div className={styles.permissionCopy}>
          <div className={styles.permissionTitle}>
            <Trash2 size={17} aria-hidden="true" />
            <strong>Apagar planeamento desta conta</strong>
          </div>
          <p>
            Apaga direção anual, métricas anuais, objetivos mensais, planos semanais e planeamento diário derivado.
            Não apaga sessões, estudo ou reviews.
          </p>
        </div>
        <button
          className={styles.dangerAction}
          type="button"
          onClick={() => {
            setResetState("idle");
            setShowConfirm(true);
          }}
          disabled={!canReset}
        >
          <Trash2 size={16} aria-hidden="true" />
          <span>{resetState === "deleting" ? "A apagar..." : "Apagar planeamento"}</span>
        </button>
      </div>
      {auth.kind === "loading" ? <p className={styles.demoMessage}>A confirmar sessão...</p> : null}
      {auth.kind === "signed-out" ? <p className={styles.demoMessage}>Entra para poderes apagar dados desta conta.</p> : null}
      {resetState === "deleted" ? (
        <p className={styles.demoMessage}>Planeamento apagado. Registos removidos: {deletedCount}.</p>
      ) : null}
      {resetState === "error" ? (
        <p className={styles.errorMessage}>Não foi possível apagar o planeamento. Tenta novamente.</p>
      ) : null}

      {showConfirm ? (
        <PlanningResetDialog
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => void confirmReset()}
          saving={resetState === "deleting"}
        />
      ) : null}
    </SettingsPanel>
  );
}

function PlanningResetDialog({
  onCancel,
  onConfirm,
  saving = false,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saving?: boolean;
}) {
  return (
    <div className={styles.modalLayer} role="presentation">
      <button className={styles.modalScrim} type="button" aria-label="Fechar confirmação" onClick={onCancel} />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="planning-reset-confirm-title">
        <header>
          <div>
            <span>Reset de testes</span>
            <h2 id="planning-reset-confirm-title">Apagar planeamento desta conta?</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onCancel} disabled={saving}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <p>
          Isto apaga só os dados de planeamento ligados a este utilizador: direção anual, métricas anuais, objetivos
          mensais, planos semanais, blocos e planeamento diário derivado. Sessões, estudo e reviews ficam preservados.
        </p>
        <footer>
          <button className={styles.secondaryAction} type="button" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button className={styles.dangerAction} type="button" onClick={onConfirm} disabled={saving}>
            <Trash2 size={15} aria-hidden="true" />
            <span>{saving ? "A apagar..." : "Sim, apagar planeamento"}</span>
          </button>
        </footer>
      </section>
    </div>
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

function HandReviewSettings() {
  if (!hasPersistenceConfig) return <HandReviewSettingsLocal />;

  return <PersistedHandReviewSettings />;
}

function PersistedHandReviewSettings() {
  const auth = usePersistenceAuth();
  const canUsePersistence = auth.kind === "ready";
  const settings = useQuery(api.userPreferences.getSessionCaptureSettings, canUsePersistence ? {} : "skip");

  if (auth.kind === "loading" || (canUsePersistence && settings === undefined)) {
    return (
      <SettingsPanel title="Mãos para rever" compact>
        <p className={styles.demoMessage}>A carregar preferências...</p>
      </SettingsPanel>
    );
  }

  return (
    <PersistedHandReviewSettingsEditor
      authKind={auth.kind}
      persistedEnableScreenshot={settings?.enableHandScreenshotUrl ?? true}
      persistedTemplates={settings?.handReviewTemplates ?? defaultHandReviewTemplates}
    />
  );
}

function PersistedHandReviewSettingsEditor({
  authKind,
  persistedEnableScreenshot,
  persistedTemplates,
}: {
  authKind: "ready" | "signed-out" | "unavailable";
  persistedEnableScreenshot: boolean;
  persistedTemplates: string[];
}) {
  const saveSettings = useMutation(api.userPreferences.saveSessionCaptureSettings);
  const [templates, setTemplates] = useState(persistedTemplates);
  const [enableScreenshot, setEnableScreenshot] = useState(persistedEnableScreenshot);
  const [newTemplate, setNewTemplate] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hasChanges =
    enableScreenshot !== persistedEnableScreenshot ||
    normalizeTemplateList(templates).join("\n") !== normalizeTemplateList(persistedTemplates).join("\n");
  const canSave = authKind === "ready" && hasChanges && saveState !== "saving";

  async function save() {
    if (!canSave) return;

    setSaveState("saving");
    try {
      await saveSettings({
        handReviewTemplates: normalizeTemplateList(templates),
        enableHandScreenshotUrl: enableScreenshot,
      });
      setNewTemplate("");
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <SettingsPanel title="Mãos para rever">
      <HandReviewSettingsForm
        disabled={authKind !== "ready" || saveState === "saving"}
        enableScreenshot={enableScreenshot}
        newTemplate={newTemplate}
        onAddTemplate={() => {
          setTemplates(addTemplate(templates, newTemplate));
          setNewTemplate("");
          setSaveState("idle");
        }}
        onEnableScreenshotChange={(enabled) => {
          setEnableScreenshot(enabled);
          setSaveState("idle");
        }}
        onNewTemplateChange={setNewTemplate}
        onRemoveTemplate={(index) => {
          setTemplates((current) => current.filter((_, itemIndex) => itemIndex !== index));
          setSaveState("idle");
        }}
        onRenameTemplate={(index, value) => {
          setTemplates((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
          setSaveState("idle");
        }}
        onSave={() => void save()}
        saveDisabled={!canSave}
        saving={saveState === "saving"}
        templates={templates}
      />
      {authKind === "signed-out" ? <p className={styles.demoMessage}>Entra para guardar estas preferências.</p> : null}
      {saveState === "saved" ? <p className={styles.demoMessage}>Preferências guardadas.</p> : null}
      {saveState === "error" ? <p className={styles.errorMessage}>Não foi possível guardar. Tenta novamente.</p> : null}
    </SettingsPanel>
  );
}

function HandReviewSettingsLocal() {
  const [templates, setTemplates] = useState(defaultHandReviewTemplates);
  const [enableScreenshot, setEnableScreenshot] = useState(true);
  const [newTemplate, setNewTemplate] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <SettingsPanel title="Mãos para rever">
      <HandReviewSettingsForm
        enableScreenshot={enableScreenshot}
        newTemplate={newTemplate}
        onAddTemplate={() => {
          setTemplates(addTemplate(templates, newTemplate));
          setNewTemplate("");
          setSaved(false);
        }}
        onEnableScreenshotChange={(enabled) => {
          setEnableScreenshot(enabled);
          setSaved(false);
        }}
        onNewTemplateChange={setNewTemplate}
        onRemoveTemplate={(index) => {
          setTemplates((current) => current.filter((_, itemIndex) => itemIndex !== index));
          setSaved(false);
        }}
        onRenameTemplate={(index, value) => {
          setTemplates((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
          setSaved(false);
        }}
        onSave={() => {
          setTemplates((current) => normalizeTemplateList(current));
          setSaved(true);
        }}
        saveDisabled={false}
        templates={templates}
      />
      {saved ? <p className={styles.demoMessage}>Demo local: preferências simuladas nesta página.</p> : null}
    </SettingsPanel>
  );
}

function HandReviewSettingsForm({
  disabled = false,
  enableScreenshot,
  newTemplate,
  onAddTemplate,
  onEnableScreenshotChange,
  onNewTemplateChange,
  onRemoveTemplate,
  onRenameTemplate,
  onSave,
  saveDisabled,
  saving = false,
  templates,
}: {
  disabled?: boolean;
  enableScreenshot: boolean;
  newTemplate: string;
  onAddTemplate: () => void;
  onEnableScreenshotChange: (enabled: boolean) => void;
  onNewTemplateChange: (value: string) => void;
  onRemoveTemplate: (index: number) => void;
  onRenameTemplate: (index: number, value: string) => void;
  onSave: () => void;
  saveDisabled: boolean;
  saving?: boolean;
  templates: string[];
}) {
  return (
    <div className={styles.handReviewSettings}>
      <div className={styles.settingRow}>
        <div className={styles.permissionCopy}>
          <div className={styles.permissionTitle}>
            <strong>Categorias de mãos</strong>
          </div>
          <p>Edita a lista que aparece no formulário de captura durante a sessão.</p>
        </div>
        <button className={styles.primaryAction} type="button" onClick={onSave} disabled={saveDisabled || disabled}>
          <Check size={15} aria-hidden="true" />
          <span>{saving ? "A guardar..." : "Guardar"}</span>
        </button>
      </div>

      <div className={styles.templateEditor} aria-label="Categorias de mãos para rever">
        {templates.map((template, index) => (
          <div className={styles.templateRow} key={`${index}-${template}`}>
            <input
              aria-label={`Categoria ${index + 1}`}
              disabled={disabled}
              value={template}
              onChange={(event) => onRenameTemplate(index, event.target.value)}
            />
            <button
              aria-label={`Remover ${template || "categoria"}`}
              className={styles.iconAction}
              disabled={disabled || templates.length <= 1}
              type="button"
              onClick={() => onRemoveTemplate(index)}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <div className={styles.addTemplateRow}>
        <input
          aria-label="Nova categoria"
          disabled={disabled}
          placeholder="Nova categoria"
          value={newTemplate}
          onChange={(event) => onNewTemplateChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            onAddTemplate();
          }}
        />
        <button className={styles.secondaryAction} type="button" onClick={onAddTemplate} disabled={disabled || !newTemplate.trim()}>
          <Plus size={15} aria-hidden="true" />
          <span>Adicionar</span>
        </button>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.permissionCopy}>
          <div className={styles.permissionTitle}>
            <strong>Campo Gyazo/screenshot</strong>
          </div>
          <p>Mostra um campo extra para URL quando queres anexar uma imagem à mão marcada.</p>
        </div>
        <button
          aria-checked={enableScreenshot}
          aria-label={`${enableScreenshot ? "Desativar" : "Ativar"} campo Gyazo/screenshot`}
          className={enableScreenshot ? `${styles.toggle} ${styles.toggleOn}` : styles.toggle}
          disabled={disabled}
          onClick={() => onEnableScreenshotChange(!enableScreenshot)}
          role="switch"
          type="button"
        >
          <span />
        </button>
      </div>
    </div>
  );
}

function addTemplate(current: string[], next: string) {
  return normalizeTemplateList([...current, next]);
}

function normalizeTemplateList(values: string[]) {
  const seen = new Set<string>();
  const templates = values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLocaleLowerCase("pt-PT");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);

  return templates.length ? templates : defaultHandReviewTemplates;
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
