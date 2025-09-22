// DOM読み込み完了後にスクリプトを実行
document.addEventListener('DOMContentLoaded', () => {
  console.log("バージョン 4.2 (Sort fix)");

  // --- 定数定義 ---
  const EXPIRATION_THRESHOLD_DAYS = 7; // 期限が近いと判断する日数

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

  // --- アプリケーションの状態 ---
  let itemList = JSON.parse(localStorage.getItem("items")) || [];
  let editingIndex = null;
  let currentMonthOffset = 0;

  // --- ヘルパー関数 ---
  /**
   * 日付文字列から期限の状態を判定
   * @param {string} dateStr - 'YYYY-MM-DD'形式の日付文字列
   * @returns {{diffDays: number, isExpired: boolean, isUpcoming: boolean, color: string}}
   */
  const getExpirationStatus = (dateStr) => {
    const itemDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時刻をリセットして日付のみで比較

    const diffDays = Math.floor((itemDate - today) / (1000 * 60 * 60 * 24));
    const isExpired = itemDate < today;
    const isUpcoming = !isExpired && diffDays <= EXPIRATION_THRESHOLD_DAYS;

    let color = 'black';
    if (isExpired) color = 'red';
    else if (isUpcoming) color = 'orange';

    return { diffDays, isExpired, isUpcoming, color };
  };
  
  /**
   * ローカルストレージにデータを保存
   */
  const saveToLocal = () => {
    localStorage.setItem("items", JSON.stringify(itemList));
  };
  
  /**
   * 指定された画面を表示し、他を非表示にする
   * @param {string} screenKey - 'input', 'list', 'calendar' のいずれか
   */
  const switchScreen = (screenKey) => {
    Object.keys(screens).forEach(key => {
      screens[key].classList.toggle('hidden', key !== screenKey);
    });
  };

  /**
   * 期限切れ・期限間近アイテムをアラートで通知する関数
   */
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
  /**
   * 年月日に合わせて日セレクタを更新
   */
  const updateDaySelector = () => {
    const year = parseInt(elements.year.value);
    const month = parseInt(elements.month.value);
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = elements.day.value;

    elements.day.innerHTML = "";
    for (let d = 1; d <= daysInMonth; d++) {
      const option = new Option(d, d);
      elements.day.appendChild(option);
    }
    // 以前選択していた日が存在すれば再選択
    if (currentDay <= daysInMonth) {
      elements.day.value = currentDay;
    }
  };
  
  /**
   * 日付セレクタを初期化
   */
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

  // --- データ操作と描画 ---
  /**
   * フォームをクリア
   */
  const clearForm = () => {
    form.reset();
    initDateSelectors(); // 日付を現在にリセット
    editingIndex = null;
  };
  
  /**
   * アイテムを保存または更新
   */
  const saveItem = (event) => {
    event.preventDefault(); // フォームのデフォルト送信をキャンセル
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
    showAlertForExpiredItems(); // 保存後、一覧表示時にアラート
    clearForm();
  };
  
  /**
   * アイテムを削除
   */
  const deleteItem = (index) => {
    if (confirm("本当に削除しますか？")) {
      itemList.splice(index, 1);
      saveToLocal();
      renderList();
    }
  };
  
  /**
   * アイテムを編集フォームに読み込む
   */
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
  
  /**
   * アイテム一覧をフィルタリングして描画
   */
  const renderList = () => {
    const genre = genreFilter.value;
    const area = areaFilter.value;
    const sortOrder = sortSelect.value;
    
    // フィルタリング
    let filteredItems = itemList.filter(item => 
      (genre === "すべて" || item.genre === genre) &&
      (area === "すべて" || item.area === area)
    );

    // ソート
    filteredItems.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        // ★修正箇所: `dateB - a` を `dateB - dateA` に修正
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // 描画
    listTableBody.innerHTML = "";
    const fragment = document.createDocumentFragment();
    filteredItems.forEach((item, originalIndex) => {
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
  
  /**
   * カレンダーを描画
   */
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
                ul
