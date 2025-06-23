let itemList = JSON.parse(localStorage.getItem("items")) || [];
let editingIndex = null;
console.log("バージョン2.04")

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
  document.getElementById("calendar-screen").style.display = "none"; // ← これ追加！
  document.getElementById("list-screen").style.display = "block";
}


function showInput(isEdit = false) {
  document.getElementById("input-screen").style.display = "block";
  document.getElementById("list-screen").style.display = "none";
  document.getElementById("calendar-screen").style.display = "none"; // ← ここも！
  if (!isEdit) clearForm();
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

  let currentMonthOffset = 0; // 0:今月, -1:先月, +1:来月...

  function showCalendar() {
    document.getElementById("input-screen").style.display = "none";
    document.getElementById("list-screen").style.display = "none";
    document.getElementById("calendar-screen").style.display = "block";
    renderCalendar();
  }

  function changeMonth(offset) {
    currentMonthOffset += offset;
    renderCalendar();
  }

  function renderCalendar() {
    const table = document.getElementById("calendar-table");
    const monthLabel = document.getElementById("calendar-month");
    const now = new Date();
    const viewDate = new Date(now.getFullYear(), now.getMonth() + currentMonthOffset, 1);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    monthLabel.textContent = `${year}年 ${month + 1}月`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    table.innerHTML = "<tr><th>日</th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th></tr>";

    let row = "<tr>";
    for (let i = 0; i < firstDay; i++) row += "<td></td>";

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const items = itemList.filter(item => item.date === dateStr);

      let cellContent = `<strong>${d}</strong>`;
      if (items.length > 0) {
        cellContent += `<ul style='padding-left: 1em;'>`;
        items.forEach(item => {
          cellContent += `<li style='font-size: 0.8em;'>${item.name}</li>`;
        });
        cellContent += `</ul>`;
      }

      row += `<td>${cellContent}</td>`;
      if ((firstDay + d) % 7 === 0) {
        row += "</tr><tr>";
      }
    }
    row += "</tr>";
    table.innerHTML += row;
  }
