import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBjmJlr2Y6I_MxJLmOMwJeZEs-R8-dGyBU",
  authDomain: "kaylies-budget.firebaseapp.com",
  projectId: "kaylies-budget",
  storageBucket: "kaylies-budget.firebasestorage.app",
  messagingSenderId: "551695158826",
  appId: "1:551695158826:web:ff1a003cfd6eda0b823d53",
  measurementId: "G-B4KVDF25RY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_ID = "default";

const monthSelect = document.getElementById('monthSelect');

const plannedIncomeEl = document.getElementById('plannedIncome');
const totalSpentEl = document.getElementById('totalSpent');
const remainingAmountEl = document.getElementById('remainingAmount');
const remainingCard = document.getElementById('remainingCard');

const incomeName = document.getElementById('incomeName');
const incomeAmount = document.getElementById('incomeAmount');
const addIncomeBtn = document.getElementById('addIncomeBtn');
const incomeTableBody = document.getElementById('incomeTableBody');

const expenseName = document.getElementById('expenseName');
const expenseCategory = document.getElementById('expenseCategory');
const expenseAmount = document.getElementById('expenseAmount');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const expenseTableBody = document.getElementById('expenseTableBody');

const clearMonthBtn = document.getElementById('clearMonthBtn');

function getMonthKey() {
  return monthSelect.value || new Date().toISOString().slice(0, 7);
}

function formatCurrency(num) {
  return '$' + (Number(num) || 0).toFixed(2);
}

/* iPhone Confetti */
function launchConfetti() {
  const count = 45;

  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.classList.add("confetti");

    c.style.setProperty("--hue", Math.floor(Math.random() * 360));
    c.style.left = Math.random() * window.innerWidth + "px";
    c.style.animationDelay = (Math.random() * 0.4) + "s";

    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2500);
  }
}

async function addIncome() {
  const name = incomeName.value.trim();
  const amount = Number(incomeAmount.value);

  if (!name || !amount) {
    alert("Please enter a name and amount.");
    return;
  }

  const monthKey = getMonthKey();
  const today = new Date().toISOString().slice(0, 10);

  await addDoc(collection(db, `users/${USER_ID}/months/${monthKey}/incomeEntries`), {
    name,
    amount,
    date: today
  });

  incomeName.value = "";
  incomeAmount.value = "";

  launchConfetti();
}

async function deleteIncome(id) {
  const monthKey = getMonthKey();
  await deleteDoc(doc(db, `users/${USER_ID}/months/${monthKey}/incomeEntries/${id}`));
}

async function addExpense() {
  const name = expenseName.value.trim();
  const category = expenseCategory.value;
  const amount = Number(expenseAmount.value);

  if (!name || !amount) {
    alert("Please enter a name and amount.");
    return;
  }

  const monthKey = getMonthKey();
  const today = new Date().toISOString().slice(0, 10);

  await addDoc(collection(db, `users/${USER_ID}/months/${monthKey}/expenses`), {
    name,
    category,
    amount,
    date: today
  });

  expenseName.value = "";
  expenseAmount.value = "";
}

async function deleteExpense(id) {
  const monthKey = getMonthKey();
  await deleteDoc(doc(db, `users/${USER_ID}/months/${monthKey}/expenses/${id}`));
}

async function clearMonth() {
  if (!confirm("Clear all data for this month?")) return;

  const monthKey = getMonthKey();

  const expCol = collection(db, `users/${USER_ID}/months/${monthKey}/expenses`);
  const expSnap = await getDocs(expCol);
  for (const d of expSnap.docs) await deleteDoc(d.ref);

  const incCol = collection(db, `users/${USER_ID}/months/${monthKey}/incomeEntries`);
  const incSnap = await getDocs(incCol);
  for (const d of incSnap.docs) await deleteDoc(d.ref);
}

let unsubscribeIncome = null;
let unsubscribeExpenses = null;

function subscribeToMonth() {
  const monthKey = getMonthKey();

  const incomeCol = collection(db, `users/${USER_ID}/months/${monthKey}/incomeEntries`);
  const expCol = collection(db, `users/${USER_ID}/months/${monthKey}/expenses`);

  if (unsubscribeIncome) unsubscribeIncome();
  if (unsubscribeExpenses) unsubscribeExpenses();

  unsubscribeIncome = onSnapshot(incomeCol, (snapshot) => {
    incomeTableBody.innerHTML = "";
    let totalIncome = 0;

    snapshot.forEach(docSnap => {
      const inc = { id: docSnap.id, ...docSnap.data() };
      totalIncome += Number(inc.amount) || 0;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span>Date</span>: ${inc.date}</td>
        <td><span>Name</span>: ${inc.name}</td>
        <td><span>Amount</span>: ${formatCurrency(inc.amount)}</td>
        <td><button class="btn-danger">Delete</button></td>
      `;
      tr.querySelector("button").onclick = () => deleteIncome(inc.id);
      incomeTableBody.appendChild(tr);
    });

    plannedIncomeEl.textContent = formatCurrency(totalIncome);

    const totalSpent = Number(totalSpentEl.textContent.replace('$','')) || 0;
    const remaining = totalIncome - totalSpent;

    remainingAmountEl.textContent = formatCurrency(remaining);

    remainingCard.classList.toggle("good", remaining >= 0);
    remainingCard.classList.toggle("bad", remaining < 0);
  });

  unsubscribeExpenses = onSnapshot(expCol, (snapshot) => {
    expenseTableBody.innerHTML = "";
    let total = 0;

    snapshot.forEach(docSnap => {
      const exp = { id: docSnap.id, ...docSnap.data() };
      total += Number(exp.amount) || 0;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span>Date</span>: ${exp.date}</td>
        <td><span>Name</span>: ${exp.name}</td>
        <td><span>Category</span>: <span class="category-pill">${exp.category}</span></td>
        <td><span>Amount</span>: ${formatCurrency(exp.amount)}</td>
        <td><button class="btn-danger">Delete</button></td>
      `;
      tr.querySelector("button").onclick = () => deleteExpense(exp.id);
      expenseTableBody.appendChild(tr);
    });

    totalSpentEl.textContent = formatCurrency(total);

    const totalIncome = Number(plannedIncomeEl.textContent.replace('$
