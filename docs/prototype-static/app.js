const taskList = document.querySelector("#task-list");
const completedCount = document.querySelector("#completed-count");
const taskCountBadge = document.querySelector("#task-count-badge");
const commitmentProgressFill = document.querySelector("#commitment-progress-fill");
const replyForm = document.querySelector("#reply-form");
const replyInput = document.querySelector("#reply-input");
const coachFeed = document.querySelector("#coach-feed");
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector(".theme-icon");
const readinessScore = document.querySelector("#readiness-score");

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  themeIcon.textContent = isDark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", isDark ? "Ativar light mode" : "Ativar dark mode");
}

function updateCompletedCount() {
  const tasks = [...taskList.querySelectorAll("input[type='checkbox']")];
  const completed = tasks.filter((task) => task.checked).length;
  completedCount.textContent = `${completed}/${tasks.length}`;
  taskCountBadge.textContent = `${completed}/${tasks.length} feito`;
  commitmentProgressFill.style.width = `${(completed / tasks.length) * 100}%`;
}

function updateReadiness() {
  const scores = [...document.querySelectorAll(".score-input")].map((input) => Number(input.value));
  if (!scores.length) return;

  const [sleep, energy, focus, stress] = scores;
  const rawScore = ((sleep + energy + focus + (6 - stress)) / 20) * 100;
  readinessScore.textContent = Math.round(rawScore);
}

function addCoachReply(message) {
  const userMessage = document.createElement("article");
  userMessage.className = "user-message";
  userMessage.innerHTML = `
    <div class="message-header"><strong>Tu</strong><time>agora</time></div>
    <p>${message}</p>
  `;

  const coachMessage = document.createElement("article");
  coachMessage.className = "coach-message";
  coachMessage.innerHTML = `
    <div class="message-header"><strong>✦ Coach AI</strong><time>agora</time></div>
    <p>Boa. Vou transformar isso numa ação simples para o plano de hoje.</p>
    <strong>Próximo passo: escolhe quando vais executar e como vais medir se cumpriste.</strong>
  `;

  coachFeed.append(userMessage, coachMessage);
  coachFeed.scrollTop = coachFeed.scrollHeight;
}

taskList.addEventListener("change", updateCompletedCount);

replyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = replyInput.value.trim();
  if (!message) return;

  addCoachReply(message);
  replyInput.value = "";
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
  localStorage.setItem("theme", nextTheme);
  applyTheme(nextTheme);
});

document.querySelectorAll(".mode-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;

    document.querySelectorAll(".mode-tabs button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    document.querySelectorAll(".mode-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === mode);
    });
  });
});

document.querySelectorAll(".score-input").forEach((input) => {
  input.addEventListener("input", updateReadiness);
});

applyTheme(localStorage.getItem("theme") || "light");
updateCompletedCount();
updateReadiness();
