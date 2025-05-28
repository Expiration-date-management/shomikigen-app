let itemList = [];
let editingIndex = null;

window.onload = function () {
  loadFromLocal();
  initDateSelectors();
};

function saveItem() {
  const name = document.getElementById("item-name").value;
  const year = parseInt(document.getElementById("year").value);
  const month = parseInt(document.getElementById("month").value);
  const day = parseInt(document.getElementById("day").value);

  if (!name || !isValidDate(year, month, day)) {
    alert("正しい入力をしてください！");
    return;
  }

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const newItem = { name, date: dateStr };

  if (editingIndex !== null) {
    // 編集中：ローカルデータを上書き。Google Sheetsには送信しない
    itemList[editingIndex] = newItem;
    editingIndex = null;
  } else {
    // 新規追加時だけ Sheets にも保存
    itemList.push(newItem);
    sendToGoogleSheets(name, dateStr);
  }

  saveToLocal();
  renderList();
  showList();
}


function renderList() {
  const container = document.getElementById("item-list");
  container.innerHTML = "";

  itemList.forEach((item, index) => {
    const div = document.createElement("div");
    div.textContent = `${item.name} - 賞味期限: ${item.date}`;

    const editBtn = document.createElement("button");
    editBtn.textContent = "編集";
    editBtn.onclick = () => startEdit(index);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.onclick = () => deleteItem(index);

    div.appendChild(editBtn);
    div.appendChild(deleteBtn);
    container.appendChild(div);
  });
}

function startEdit(index) {
  const item = itemList[index];
  editingIndex = index;

  document.getElementById("item-name").value = item.name;
  const [year, month, day] = item.date.split("-").map(Number);
  document.getElementById("year").value = year;
  document.getElementById("month").value = month;
  updateDays();
  document.getElementById("day").value = day;

  showForm();
}

function deleteItem(index) {
  if (confirm("このデータを削除しますか？")) {
    itemList.splice(index, 1);
    saveToLocal();
    renderList();
  }
}

function showList() {
  renderList();
  document.getElementById("form-view").style.display = "none";
  document.getElementById("list-screen").style.display = "block";
}

function showForm() {
  // 画面切り替え
  document.getElementById("list-screen").style.display = "none";
  document.getElementById("form-view").style.display = "block";

  // フォームの初期化（ただし編集時は中身を維持する）
  if (editingIndex === null) {
    document.getElementById("item-name").value = "";
    const today = new Date();
    document.getElementById("year").value = today.getFullYear();
    document.getElementById("month").value = today.getMonth() + 1;
    updateDays();
    document.getElementById("day").value = today.getDate();
  }

  // 👇 ここは削除！！！
  // editingIndex = null;
}


function saveToLocal() {
  localStorage.setItem("items", JSON.stringify(itemList));
}

function loadFromLocal() {
  const data = localStorage.getItem("items");
  if (data) {
    itemList = JSON.parse(data);
  }
}

function isValidDate(year, month, day) {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function initDateSelectors() {
  const yearSelect = document.getElementById("year");
  const monthSelect = document.getElementById("month");
  const daySelect = document.getElementById("day");

  const thisYear = new Date().getFullYear();
  for (let y = thisYear; y <= thisYear + 5; y++) {
    yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
  }
  for (let m = 1; m <= 12; m++) {
    monthSelect.innerHTML += `<option value="${m}">${m}</option>`;
  }
  for (let d = 1; d <= 31; d++) {
    daySelect.innerHTML += `<option value="${d}">${d}</option>`;
  }

  yearSelect.addEventListener("change", updateDays);
  monthSelect.addEventListener("change", updateDays);
}

function updateDays() {
  const year = parseInt(document.getElementById("year").value);
  const month = parseInt(document.getElementById("month").value);
  const daySelect = document.getElementById("day");

  const lastDay = new Date(year, month, 0).getDate();
  daySelect.innerHTML = "";
  for (let d = 1; d <= lastDay; d++) {
    daySelect.innerHTML += `<option value="${d}">${d}</option>`;
  }
}

function sendToGoogleSheets(name, date) {
  const url = "https://script.google.com/a/macros/fcs.ed.jp/s/AKfycbx31O_MaBPYH_Q3FXwWfOg_EUiQhphoCSlXcRPi4WZnGEznPhUNxWhdg1CwfpTPxZWgeA/exec"; // 👈 ここ！

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, date })
  })
    .then(res => res.text())
    .then(result => console.log("保存結果:", result))
    .catch(err => console.error("エラー:", err));
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log("Service Worker registered"))
    .catch(err => console.error("SW registration failed:", err));
}
