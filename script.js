let itemList = [];
let editingIndex = null;
console.log("バージョン1.2")

window.onload = function () {
  loadFromLocal();
  initDateSelectors();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
};

function saveItem() {
  const name = document.getElementById("item-name").value;
  const year = parseInt(document.getElementById("year").value);
  const month = parseInt(document.getElementById("month").value);
  const day = parseInt(document.getElementById("day").value);
  const genre = document.getElementById("genre").value;

  if (!name || !isValidDate(year, month, day)) {
    alert("正しい入力をしてください！");
    return;
  }

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const newItem = { name, date: dateStr, genre };

  if (editingIndex !== null) {
    itemList[editingIndex] = newItem;
    editingIndex = null;
  } else {
    itemList.push(newItem);
    sendToGoogleSheets(name, dateStr, genre);
  }

  saveToLocal();
  renderList();
  showList();
}

function renderList(filter = "すべて") {
  const container = document.getElementById("item-list");
  container.innerHTML = "";

  const filtered = filter === "すべて"
    ? itemList
    : itemList.filter(item => item.genre === filter);

  filtered.forEach((item, index) => {
    const div = document.createElement("div");
    div.textContent = `${item.name} - ${item.genre} - 賞味期限: ${item.date}`;

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
  const [y, m, d] = item.date.split("-").map(Number);
  document.getElementById("year").value = y;
  document.getElementById("month").value = m;
  updateDays();
  document.getElementById("day").value = d;
  document.getElementById("genre").value = item.genre;
  showForm();
}

function deleteItem(index) {
  if (confirm("削除しますか？")) {
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
  document.getElementById("list-screen").style.display = "none";
  document.getElementById("form-view").style.display = "block";

  if (editingIndex === null) {
    document.getElementById("item-name").value = "";
    const today = new Date();
    document.getElementById("year").value = today.getFullYear();
    document.getElementById("month").value = today.getMonth() + 1;
    updateDays();
    document.getElementById("day").value = today.getDate();
    document.getElementById("genre").value = "調味料";
  }
}

function filterList() {
  const selected = document.getElementById("genre-filter").value;
  renderList(selected);
}

function saveToLocal() {
  localStorage.setItem("items", JSON.stringify(itemList));
}

function loadFromLocal() {
  const data = localStorage.getItem("items");
  if (data) itemList = JSON.parse(data);
}

function isValidDate(y, m, d) {
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function initDateSelectors() {
  const year = document.getElementById("year");
  const month = document.getElementById("month");
  const day = document.getElementById("day");
  const thisYear = new Date().getFullYear();

  for (let y = thisYear; y <= thisYear + 5; y++) year.innerHTML += `<option value="${y}">${y}</option>`;
  for (let m = 1; m <= 12; m++) month.innerHTML += `<option value="${m}">${m}</option>`;
  updateDays();

  year.addEventListener("change", updateDays);
  month.addEventListener("change", updateDays);
}

function updateDays() {
  const y = parseInt(document.getElementById("year").value);
  const m = parseInt(document.getElementById("month").value);
  const day = document.getElementById("day");

  const last = new Date(y, m, 0).getDate();
  day.innerHTML = "";
  for (let d = 1; d <= last; d++) {
    day.innerHTML += `<option value="${d}">${d}</option>`;
  }
}

function sendToGoogleSheets(name, date, genre) {
  const url = "https://script.google.com/macros/s/AKfycbzLgIKQrHRmHrf0nE2t6z-fiBx-OBvQmo2fLFTV8-_3NniQp_Ia_xaM7VLFpkN0Br0/exec";

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, date, genre })
  })
  .then((res) => res.text())
  .then((text) => console.log("GASからの応答:", text))
  .catch((err) => console.error("送信エラー:", err));
}

