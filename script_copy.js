const itemList = [];

function addItem() {
  const name = document.getElementById("item-name").value;
  const date = document.getElementById("expiry-date").value;

  if (!name || !date) {
    alert("食材名と賞味期限を入力してください！");
    return;
  }

  itemList.push({ name, date });
  saveToLocal();
  renderList();
  showList();
}

function renderList() {
  const ul = document.getElementById("item-list");
  ul.innerHTML = "";

  itemList.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.date}`;
    ul.appendChild(li);
  });
}

function saveToLocal() {
  localStorage.setItem("items", JSON.stringify(itemList));
}

function loadFromLocal() {
  const data = localStorage.getItem("items");
  if (data) {
    const parsed = JSON.parse(data);
    parsed.forEach(item => itemList.push(item));
    renderList();
  }
}

function showList() {
  document.getElementById("form-view").style.display = "none";
  document.getElementById("list-view").style.display = "block";
}

function showForm() {
  document.getElementById("list-view").style.display = "none";
  document.getElementById("form-view").style.display = "block";
}

// 起動時に読み込み
window.onload = loadFromLocal;
