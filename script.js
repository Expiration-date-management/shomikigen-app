// DOM読み込み完了後にスクリプトを実行
document.addEventListener('DOMContentLoaded', () => {
  console.log("バージョン 5.0 (Backup/Restore Feature)");

  // --- 定数定義 ---
  const EXPIRATION_THRESHOLD_DAYS = 7;

  // --- DOM要素の取得 ---
  const screens = {
    input: document.getElementById('input-screen'),
    list: document.getElementById('list-screen'),
    calendar: document.getElementById('calendar-screen'),
  };
  const form = document.getElementById('input-form');
  const elements = {
    name: document.getElementById('item-name'),
    year: document.getElementById('year'),
    month: document.getElementById('month'),
    day: document.getElementById('day'),
    genre: document.getElementById('genre'),
    area: document.getElementById('area'),
    remarks: document.getElementById('remarks'),
  };
  const listTableBody = document.querySelector('#item-table tbody');
  const calendarTableBody = document.querySelector('#calendar-table tbody');
  const calendarMonthLabel = document.getElementById('calendar-month');
  
  const genreFilter = document.getElementById('genre-filter');
  const areaFilter = document.getElementById('area-filter');
  const sortSelect = document.getElementById('sort-select');
  
  // ★バックアップ・復元用のDOM要素
  const exportBtn = document.getElementById('export-btn');
  const importFile = document.getElementById('import-file');


  // --- アプリケーションの状態 ---
  let itemList = JSON.parse(localStorage.getItem("items")) || [];
  let editingIndex = null;
  let currentMonthOffset = 0;

  // --- ヘルパー関数 ---
  const getExpirationStatus = (dateStr) => {
    const itemDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((itemDate - today) / (1000 * 60 * 60 * 24));
    const isExpired = itemDate < today;
    const isUpcoming = !isExpired && diffDays <= EXPIRATION_THRESHOLD_DAYS;

    let color = 'black';
    if (isExpired) color = 'red';
    else if (isUpcoming) color = 'orange';

    return { diffDays, isExpired, isUpcoming, color };
  };
  
  const saveToLocal = () => {
    localStorage.setItem("items", JSON.stringify(itemList));
  };
  
  const switchScreen = (screenKey) => {
    Object.keys(screens).forEach(key => {
      screens[key].classList.toggle('hidden', key !== screenKey);
    });
  };

  const showAlertForExpiredItems = () => {
    const expired = itemList.filter(item => getExpirationStatus(item.date).isExpired);
    const upcoming = itemList.filter(item => getExpirationStatus(item.date).isUpcoming);
    
    if (expired.length > 0 || upcoming.length > 0) {
        let msg = "⚠ 期限に注意が必要な食品があります\n\n";
        if (expired.length > 0) {
            msg += "【期限切れ】\n" + expired.map(i => `${i.name}（${i.date}）`).join("\n") + "\n\n";
        }
        if (upcoming.length > 0) {
            msg += "【期限が近い】\n" + upcoming.map(i => `${i.name}（${i.date}）`).join("\n");
        }
        alert(msg);
    }
  };

  // --- 日付セレクタ関連 ---
  const updateDaySelector = () => {
    const year = parseInt(elements.year.value);
    const month = parseInt(elements.month.value);
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = elements.day.value;

    elements.day.innerHTML = "";
    for (let d = 1; d <= daysInMonth; d++) {
      elements.day.appendChild(new Option(d, d));
    }
    if (currentDay <= daysInMonth) {
      elements.day.value = currentDay;
    }
  };
  
  const initDateSelectors = () => {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y <= currentYear + 10; y++) {
      elements.year.add(new Option(y, y));
    }
    for (let m = 1; m <= 12; m++) {
      elements.month.add(new Option(m, m));
    }
    elements.year.value = currentYear;
    elements.month.value = new Date().getMonth() + 1;
    updateDaySelector();
  };

  // --- ★ここからバックアップ・復元機能 ---

  /**
   * データをJSONファイルとしてエクスポート（バックアップ）
   */
  const exportData = () => {
    if (itemList.length === 0) {
      alert('バックアップするデータがありません。');
      return;
    }

    // データを読みやすく整形したJSON文字列に変換
    const jsonString = JSON.stringify(itemList, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // ファイル名の生成 (例: shomikigen_backup_2025-10-01.json)
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    a.download = `shomikigen_backup_${dateString}.json`;
    
    document.body.appendChild(a);
    a.click();
    
    // 後片付け
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('データをエクスポートしました。');
  };

  /**
   * JSONファイルをインポートしてデータを復元
   */
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // 簡単なデータ検証（配列であるか）
        if (!Array.isArray(importedData)) {
          throw new Error('無効なファイル形式です。');
        }

        if (confirm('現在のデータが上書きされます。よろしいですか？')) {
          itemList = importedData;
          saveToLocal();
          renderList();
          alert('データをインポートしました。');
        }

      } catch (error) {
        alert('ファイルの読み込みに失敗しました。\n有効なJSONファイルを選択してください。');
        console.error(error);
      } finally {
        // 同じファイルを再度選択できるように値をリセット
        event.target.value = null;
      }
    };
    reader.readAsText(file);
  };


  // --- データ操作と描画 ---
  const clearForm = () => {
    form.reset();
    initDateSelectors();
    editingIndex = null;
  };
  
  const saveItem = (event) => {
    event.preventDefault();
    const { name, year, month, day, genre, area, remarks } = elements;
    const date = new Date(year.value, month.value - 1, day.value);

    if (!name.value || date.getFullYear() !== parseInt(year.value)) {
      alert("正しい入力をしてください！");
      return;
    }

    const newItem = {
      name: name.value,
      date: `${year.value}-${String(month.value).padStart(2, "0")}-${String(day.value).padStart(2, "0")}`,
      genre: genre.value,
      area: area.value,
      remarks: remarks.value
    };

    if (editingIndex !== null) {
      itemList[editingIndex] = newItem;
    } else {
      itemList.push(newItem);
    }
    
    saveToLocal();
    renderList();
    switchScreen('list');
    showAlertForExpiredItems();
    clearForm();
  };
  
  const deleteItem = (index) => {
    if (confirm("本当に削除しますか？")) {
      itemList.splice(index, 1);
      saveToLocal();
      renderList();
    }
  };
  
  const editItem = (index) => {
    const item = itemList[index];
    const [y, m, d] = item.date.split("-").map(Number);

    elements.name.value = item.name;
    elements.year.value = y;
    elements.month.value = m;
    updateDaySelector();
    elements.day.value = d;
    elements.genre.value = item.genre;
    elements.area.value = item.area;
    elements.remarks.value = item.remarks || "";

    editingIndex = index;
    switchScreen('input');
  };
  
  const renderList = () => {
    const genre = genreFilter.value;
    const area = areaFilter.value;
    const sortOrder = sortSelect.value;
    
    let filteredItems = itemList.filter(item => 
      (genre === "すべて" || item.genre === genre) &&
      (area === "すべて" || item.area === area)
    );

    filteredItems.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    listTableBody.innerHTML = "";
    const fragment = document.createDocumentFragment();
    filteredItems.forEach((item) => {
      const { color } = getExpirationStatus(item.date);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="color: ${color}">${item.name}</td>
        <td style="color: ${color}">${item.date}</td>
        <td style="color: ${color}">${item.genre}</td>
        <td style="color: ${color}">${item.area}</td>
        <td style="color: ${color}">${item.remarks || ""}</td>
        <td>
          <button class="edit-btn" data-index="${itemList.indexOf(item)}">編集</button>
          <button class="delete-btn" data-index="${itemList.indexOf(item)}">削除</button>
        </td>
        <td>
          <a href="https://cookpad.com/jp/search/${item.name}" target="_blank" class="link-button">クックパッド</a>
          <a href="https://www.kurashiru.com/search?query=${item.name}" target="_blank" class="link-button">クラシル</a>
        </td>
      `;
      fragment.appendChild(row);
    });
    listTableBody.appendChild(fragment);
    displayUpcomingExpirations();
  };
  
  const renderCalendar = () => {
    const now = new Date();
    const viewDate = new Date(now.getFullYear(), now.getMonth() + currentMonthOffset, 1);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    calendarMonthLabel.textContent = `${year}年 ${month + 1}月`;

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    calendarTableBody.innerHTML = "";
    const fragment = document.createDocumentFragment();
    let row = document.createElement('tr');
    
    for (let i = 0; i < firstDayOfWeek; i++) {
        row.appendChild(document.createElement('td'));
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const itemsOnDate = itemList.filter(item => item.date === dateStr);
        
        const cell = document.createElement('td');
        cell.innerHTML = `<div class="calendar-cell"><strong>${d}</strong></div>`;

        if (itemsOnDate.length > 0) {
            const ul = document.createElement('ul');
            itemsOnDate.forEach(item => {
                const { color } = getExpirationStatus(item.date);
                const li = document.createElement('li');
                li.textContent = item.name;
                li.style.color = color;
                ul.appendChild(li);
            });
            cell.querySelector('.calendar-cell').appendChild(ul);
        }
        row.appendChild(cell);

        if ((firstDayOfWeek + d) % 7 === 0 || d === daysInMonth) {
            fragment.appendChild(row);
            if (d !== daysInMonth) {
                row = document.createElement('tr');
            }
        }
    }
    calendarTableBody.appendChild(fragment);
  };

  const displayUpcomingExpirations = () => {
    const expiredItems = itemList.filter(item => getExpirationStatus(item.date).isExpired);
    const upcomingItems = itemList.filter(item => getExpirationStatus(item.date).isUpcoming);

    document.querySelectorAll(".notice-container").forEach(el => el.innerHTML = "");

    if (expiredItems.length > 0 || upcomingItems.length > 0) {
      const box = document.createElement("div");
      box.className = "notice-box";
      let html = "";
      if (expiredItems.length > 0) {
        html += "<strong>期限切れ:</strong><ul>" + expiredItems.map(item => `<li>${item.name}（${item.date}）</li>`).join("") + "</ul>";
      }
      if (upcomingItems.length > 0) {
        html += "<strong>期限が近い:</strong><ul>" + upcomingItems.map(item => `<li>${item.name}（${item.date}）</li>`).join("") + "</ul>";
      }
      box.innerHTML = html;

      screens.input.querySelector('.notice-container').appendChild(box.cloneNode(true));
      screens.list.querySelector('.notice-container').appendChild(box);
    }
  };

  // --- イベントリスナーの設定 ---
  form.addEventListener('submit', saveItem);
  elements.year.addEventListener('change', updateDaySelector);
  elements.month.addEventListener('change', updateDaySelector);

  document.getElementById('show-list-btn').addEventListener('click', () => {
    renderList();
    switchScreen('list');
    showAlertForExpiredItems();
  });
  
  document.getElementById('show-calendar-btn').addEventListener('click', () => {
      renderCalendar();
      switchScreen('calendar');
  });

  document.querySelectorAll('.back-to-input-btn').forEach(btn => {
    btn.addEventListener('click', () => switchScreen('input'));
  });

  [genreFilter, areaFilter, sortSelect].forEach(el => el.addEventListener('change', renderList));

  listTableBody.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('edit-btn')) {
      editItem(Number(target.dataset.index));
    }
    if (target.classList.contains('delete-btn')) {
      deleteItem(Number(target.dataset.index));
    }
  });

  document.getElementById('prev-month-btn').addEventListener('click', () => {
    currentMonthOffset--;
    renderCalendar();
  });

  document.getElementById('next-month-btn').addEventListener('click', () => {
    currentMonthOffset++;
    renderCalendar();
  });
  
  // ★バックアップ・復元ボタンのイベントリスナー
  exportBtn.addEventListener('click', exportData);
  importFile.addEventListener('change', importData);

  // --- 初期化処理 ---
  const initialize = () => {
    initDateSelectors();
    renderList();
    displayUpcomingExpirations();
    showAlertForExpiredItems();
  };

  initialize();
});
