// ---------- State ----------
let state = JSON.parse(localStorage.getItem("sprout_state")) || {
  income: 0,
  goal: { name: "Your goal", target: 0, deadline: "" },
  expenses: [],
  contributions: []
};

// ---------- Elements ----------
const incomeInput = document.getElementById("incomeInput");
const goalNameInput = document.getElementById("goalNameInput");
const goalTargetInput = document.getElementById("goalTargetInput");
const goalDateInput = document.getElementById("goalDateInput");
const saveSetupBtn = document.getElementById("saveSetupBtn");

const expenseCategoryInput = document.getElementById("expenseCategoryInput");
const expenseAmountInput = document.getElementById("expenseAmountInput");
const addExpenseBtn = document.getElementById("addExpenseBtn");

const contributionInput = document.getElementById("contributionInput");
const addContributionBtn = document.getElementById("addContributionBtn");

const donutChart = document.getElementById("donutChart");
const chartCenterValue = document.getElementById("chartCenterValue");
const legendSpent = document.getElementById("legendSpent");
const legendRemaining = document.getElementById("legendRemaining");

const goalTitle = document.getElementById("goalTitle");
const goalProgressFill = document.getElementById("goalProgressFill");
const goalAmounts = document.getElementById("goalAmounts");
const goalPercent = document.getElementById("goalPercent");
const goalDays = document.getElementById("goalDays");
const celebration = document.getElementById("celebration");

const categoryBreakdown = document.getElementById("categoryBreakdown");
const transactionsList = document.getElementById("transactionsList");

// ---------- Persistence ----------
function saveState() {
  localStorage.setItem("sprout_state", JSON.stringify(state));
}

// ---------- Derived values ----------
function getTotalExpenses() {
  return state.expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getTotalSaved() {
  return state.contributions.reduce((sum, c) => sum + c.amount, 0);
}

function getRemaining() {
  return Math.max(state.income - getTotalExpenses(), 0);
}

function formatCurrency(n) {
  return `$${n.toFixed(0)}`;
}

// ---------- Setup form ----------
function loadSetupIntoForm() {
  incomeInput.value = state.income || "";
  goalNameInput.value = state.goal.name || "";
  goalTargetInput.value = state.goal.target || "";
  goalDateInput.value = state.goal.deadline || "";
}

saveSetupBtn.addEventListener("click", () => {
  state.income = parseFloat(incomeInput.value) || 0;
  state.goal.name = goalNameInput.value.trim() || "Your goal";
  state.goal.target = parseFloat(goalTargetInput.value) || 0;
  state.goal.deadline = goalDateInput.value || "";
  saveState();
  renderAll();
});

// ---------- Expenses ----------
addExpenseBtn.addEventListener("click", () => {
  const category = expenseCategoryInput.value.trim();
  const amount = parseFloat(expenseAmountInput.value);

  if (!category || !amount || amount <= 0) return;

  state.expenses.push({
    id: Date.now().toString(),
    category,
    amount,
    date: new Date().toISOString()
  });

  expenseCategoryInput.value = "";
  expenseAmountInput.value = "";

  saveState();
  renderAll();
});

function deleteExpense(id) {
  state.expenses = state.expenses.filter((e) => e.id !== id);
  saveState();
  renderAll();
}

// ---------- Contributions (savings) ----------
addContributionBtn.addEventListener("click", () => {
  const amount = parseFloat(contributionInput.value);
  if (!amount || amount <= 0) return;

  state.contributions.push({
    id: Date.now().toString(),
    amount,
    date: new Date().toISOString()
  });

  contributionInput.value = "";

  saveState();
  renderAll();
});

// ---------- Donut chart (canvas) ----------
function drawDonutChart(spent, remaining) {
  const ctx = donutChart.getContext("2d");
  const total = spent + remaining;
  const centerX = donutChart.width / 2;
  const centerY = donutChart.height / 2;
  const radius = 90;
  const lineWidth = 26;

  ctx.clearRect(0, 0, donutChart.width, donutChart.height);

  // Background ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#EDF2EC";
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  if (total === 0) return;

  const spentAngle = (spent / total) * Math.PI * 2;
  const startAngle = -Math.PI / 2;

  // Spent segment
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, startAngle + spentAngle);
  ctx.strokeStyle = "#E8694A";
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();

  // Remaining segment
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle + spentAngle, startAngle + Math.PI * 2);
  ctx.strokeStyle = "#2F7A5B";
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

// ---------- Goal progress ----------
function renderGoal() {
  const saved = getTotalSaved();
  const target = state.goal.target || 0;
  const percent = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

  goalTitle.textContent = `Goal: ${state.goal.name}`;
  goalProgressFill.style.width = `${percent}%`;
  goalAmounts.textContent = `${formatCurrency(saved)} of ${formatCurrency(target)}`;
  goalPercent.textContent = `${Math.round(percent)}%`;

  if (state.goal.deadline) {
    const daysLeft = Math.ceil(
      (new Date(state.goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
    );
    goalDays.textContent =
      daysLeft > 0 ? `${daysLeft} days left until your target date` : "Target date has passed";
  } else {
    goalDays.textContent = "";
  }

  if (percent >= 100 && target > 0) {
    celebration.classList.remove("hidden");
  } else {
    celebration.classList.add("hidden");
  }
}

// ---------- Category breakdown ----------
function renderCategoryBreakdown() {
  if (state.expenses.length === 0) {
    categoryBreakdown.innerHTML = `<p class="empty-state">No expenses logged yet.</p>`;
    return;
  }

  const totals = {};
  state.expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  const maxAmount = Math.max(...Object.values(totals));

  categoryBreakdown.innerHTML = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, amount]) => `
      <div class="category-row">
        <div class="category-row-top">
          <span>${category}</span>
          <span>${formatCurrency(amount)}</span>
        </div>
        <div class="category-bar-track">
          <div class="category-bar-fill" style="width:${(amount / maxAmount) * 100}%"></div>
        </div>
      </div>`
    )
    .join("");
}

// ---------- Transactions list ----------
function renderTransactions() {
  if (state.expenses.length === 0) {
    transactionsList.innerHTML = `<p class="empty-state">Nothing here yet — add your first expense above.</p>`;
    return;
  }

  const sorted = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  transactionsList.innerHTML = sorted
    .map(
      (e) => `
      <div class="transaction-row">
        <span class="transaction-category">${e.category}</span>
        <span>
          <span class="transaction-amount">−${formatCurrency(e.amount)}</span>
          <button class="transaction-delete" data-id="${e.id}">Remove</button>
        </span>
      </div>`
    )
    .join("");

  document.querySelectorAll(".transaction-delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteExpense(btn.dataset.id));
  });
}

// ---------- Overview ----------
function renderOverview() {
  const spent = getTotalExpenses();
  const remaining = getRemaining();

  chartCenterValue.textContent = formatCurrency(remaining);
  legendSpent.textContent = formatCurrency(spent);
  legendRemaining.textContent = formatCurrency(remaining);

  drawDonutChart(spent, remaining);
}

// ---------- Render everything ----------
function renderAll() {
  renderOverview();
  renderGoal();
  renderCategoryBreakdown();
  renderTransactions();
}

// ---------- Init ----------
loadSetupIntoForm();
renderAll();
