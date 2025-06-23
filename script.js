let itemList = JSON.parse(localStorage.getItem("items")) || [];
let editingIndex = null;
console.log("バージョン2.03")

function saveItem() {
  const name    = document.getElementById("item-name").value;
  const year    = parseInt(document.getElementById("year").value);
  const month   = parseInt(document.getElementById("month").value);
  const day     = parseInt(document.getElementById("day").value);
  const genre   = document.getElementById("genre").value;
  const area    = document.getElementById("area").value;
  const remarks = document.getElementById("remarks").value;   

  if (!name || !isValidDate(year, month, day)) {
    alert("正しい入力をしてください！");
    return;
  }

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const newItem = { name, date: dateStr, genre, area, remarks };

  if (editingIndex !== null) {
    itemList[editingIndex] = newItem;
    editingIndex = null;
  } else {
    itemList.push(newItem);
  }

  saveToLocal();
  renderList();
  showList();
  clearForm();
}

function isValidDate(y, m, d) {
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function saveToLocal() {
  localStorage.setItem("items", JSON.stringify(itemList));
}

function renderList() {
  const table = document.getElementById("item-table");
  table.innerHTML = "<tr><th>名前</th><th>賞味期限</th><th>ジャンル</th><th>保管場所</th><th>備考</th><th>操作</th></tr>";

  const genreFilter = document.getElementById("genre-filter").value;
  const areaFilter = document.getElementById("filter-area").value;

  itemList.forEach((item, index) => {
    if ((genreFilter !== "すべて" && item.genre !== genreFilter) || (areaFilter && item.area !== areaFilter)) {
      return;
    }

    const row = `<tr>
      <td>${item.name}</td>
      <td>${item.date}</td>
      <td>${item.genre}</td>
      <td>${item.area}</td>
      <td>${item.remarks || ""}</td>
      <td>
        <button onclick="editItem(${index})">編集</button>
        <button onclick="deleteItem(${index})">削除</button>
      </td>
    </tr>`;
    table.innerHTML += row;
  });
}



function deleteItem(index) {
  if (confirm("本当に削除しますか？")) {
    itemList.splice(index, 1);
    saveToLocal();
    renderList();
  }
}

function editItem(index) {
  const item = itemList[index];
  const [y, m, d] = item.date.split("-").map(Number);

  document.getElementById("item-name").value = item.name;
  document.getElementById("year").value = y;
  document.getElementById("month").value = m;
  updateDaysInSelector(y, m);
  document.getElementById("day").value = d;
  document.getElementById("genre").value = item.genre;
  document.getElementById("area").value = item.area;
  document.getElementById("remarks").value = item.remarks || "";

  editingIndex = index;
  showInput(true);
}

function showList() {
  document.getElementById("input-screen").style.display = "none";
  document.getElementById("list-screen").style.display = "block";
  renderList();
}

function showInput(isEdit = false) {
  document.getElementById("input-screen").style.display = "block";
  document.getElementById("list-screen").style.display = "none";
  if (!isEdit) {
    clearForm();
  }
}

function clearForm() {
  document.getElementById("item-name").value = "";
  document.getElementById("year").value = "2025";
  document.getElementById("month").value = "1";
  document.getElementById("day").value = "1";
  document.getElementById("genre").value = "調味料";
  document.getElementById("area").value = "冷蔵室";
  document.getElementById("remarks").value = "";
}

function initDateSelectors() {
  const yearSel = document.getElementById("year");
  const monthSel = document.getElementById("month");
  const daySel = document.getElementById("day");

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y <= currentYear + 10; y++) {
    const option = document.createElement("option");
    option.value = option.textContent = y;
    yearSel.appendChild(option);
  }

  for (let m = 1; m <= 12; m++) {
    const option = document.createElement("option");
    option.value = option.textContent = m;
    monthSel.appendChild(option);
  }

  function updateDays() {
    const year = parseInt(yearSel.value);
    const month = parseInt(monthSel.value);
    const daysInMonth = new Date(year, month, 0).getDate();

    daySel.innerHTML = "";
    for (let d = 1; d <= daysInMonth; d++) {
      const option = document.createElement("option");
      option.value = option.textContent = d;
      daySel.appendChild(option);
    }
  }

  yearSel.addEventListener("change", updateDays);
  monthSel.addEventListener("change", updateDays);

  yearSel.value = currentYear;
  monthSel.value = 1;
  updateDays();
}

window.onload = function () {
  initDateSelectors();
  renderList();
};

function updateDaysInSelector(year, month) {
  const daySel = document.getElementById("day");
  const daysInMonth = new Date(year, month, 0).getDate();
  daySel.innerHTML = "";
  for (let d = 1; d <= daysInMonth; d++) {
    const option = document.createElement("option");
    option.value = option.textContent = d;
    daySel.appendChild(option);
  }
}
