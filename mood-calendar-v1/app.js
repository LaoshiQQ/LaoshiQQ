const moods = [
  { id: "sunny", label: "开心", tone: "#ffd84f" },
  { id: "red", label: "生气", tone: "#fb5c63" },
  { id: "purple", label: "闷闷", tone: "#b89acb" },
  { id: "blue", label: "低落", tone: "#5d86bd" },
  { id: "green", label: "舒服", tone: "#36c985" },
  { id: "orange", label: "满足", tone: "#ff9e34" },
  { id: "pink", label: "温柔", tone: "#ffaaa6" },
  { id: "gray", label: "一般", tone: "#b8c4bd" },
];

const legacyMoodMap = {
  "😄": "sunny",
  "🙂": "sunny",
  "😌": "green",
  "🥰": "pink",
  "😐": "gray",
  "😔": "purple",
  "😤": "red",
  "😢": "blue",
  "😴": "purple",
  "🤒": "gray",
  "🤩": "orange",
  "😶": "gray",
  cat: "sunny",
  bear: "orange",
  rabbit: "pink",
  squirrel: "orange",
  dog: "sunny",
  deer: "purple",
  fox: "red",
  frog: "green",
  sheep: "purple",
  koala: "gray",
  duck: "sunny",
  penguin: "blue",
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const storageKey = "mood-calendar-entries";
const lunarDayNames = [
  "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十",
];
const solarTerms = {
  "01-05": "小寒", "01-20": "大寒", "02-04": "立春", "02-19": "雨水",
  "03-05": "惊蛰", "03-20": "春分", "04-04": "清明", "04-20": "谷雨",
  "05-05": "立夏", "05-21": "小满", "06-05": "芒种", "06-21": "夏至",
  "07-07": "小暑", "07-22": "大暑", "08-07": "立秋", "08-23": "处暑",
  "09-07": "白露", "09-23": "秋分", "10-08": "寒露", "10-23": "霜降",
  "11-07": "立冬", "11-22": "小雪", "12-07": "大雪", "12-21": "冬至",
};

const state = {
  today: new Date(),
  visibleDate: new Date(),
  selectedDate: new Date(),
  selectedMood: "sunny",
  entries: loadEntries(),
  editorOpen: false,
  showSolarTerms: false,
  showLunar: false,
};

const yearLabel = document.querySelector("#yearLabel");
const monthTitle = document.querySelector("#monthTitle");
const selectedDate = document.querySelector("#selectedDate");
const moodPreview = document.querySelector("#moodPreview");
const moodName = document.querySelector("#moodName");
const moodGrid = document.querySelector("#moodGrid");
const noteInput = document.querySelector("#noteInput");
const calendarGrid = document.querySelector("#calendarGrid");
const saveStatus = document.querySelector("#saveStatus");
const overlay = document.querySelector("#overlay");
const entrySheet = document.querySelector("#entrySheet");
const solarToggle = document.querySelector("#solarToggle");
const lunarToggle = document.querySelector("#lunarToggle");
const solarVideo = document.querySelector("#solarVideo");

document.querySelector("#prevMonth").addEventListener("click", () => changeMonth(-1));
document.querySelector("#nextMonth").addEventListener("click", () => changeMonth(1));
document.querySelector("#openEditor").addEventListener("click", openEditor);
document.querySelector("#closeEditor").addEventListener("click", closeEditor);
document.querySelector("#saveEntry").addEventListener("click", saveEntry);
solarToggle.addEventListener("click", () => toggleCalendarOption("showSolarTerms", solarToggle));
lunarToggle.addEventListener("click", () => toggleCalendarOption("showLunar"));
overlay.addEventListener("click", closeEditor);

hydrateSelectedEntry();
render();

function render() {
  const visibleYear = state.visibleDate.getFullYear();
  const visibleMonth = state.visibleDate.getMonth();
  const mood = getMood(state.selectedMood);

  yearLabel.textContent = visibleYear;
  monthTitle.textContent = monthNames[visibleMonth];
  selectedDate.textContent = formatReadableDate(state.selectedDate);
  moodName.textContent = mood.label;
  setMoodVars(moodPreview, mood);
  moodPreview.innerHTML = faceMarkup(mood.id, "large");
  renderMoodOptions();
  renderCalendar();
  renderToggles();
  renderSolarVideo();
  renderEditorState();
}

function renderMoodOptions() {
  moodGrid.innerHTML = "";
  moods.forEach((mood) => {
    const button = document.createElement("button");
    button.className = `mood-option${mood.id === state.selectedMood ? " is-active" : ""}`;
    button.type = "button";
    setMoodVars(button, mood);
    button.innerHTML = `${faceMarkup(mood.id, "button")}<span class="mood-option-label">${mood.label}</span>`;
    button.setAttribute("aria-label", `选择心情：${mood.label}`);
    button.addEventListener("click", () => {
      state.selectedMood = mood.id;
      render();
    });
    moodGrid.appendChild(button);
  });
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  const year = state.visibleDate.getFullYear();
  const month = state.visibleDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < offset; i += 1) {
    const spacer = document.createElement("div");
    spacer.className = "day-spacer";
    calendarGrid.appendChild(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = dateKey(date);
    const entry = normalizeEntry(state.entries[key]);
    const mood = entry ? getMood(entry.mood) : null;
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "day-cell",
      sameDay(date, state.today) ? "is-today" : "",
      sameDay(date, state.selectedDate) ? "is-selected" : "",
      entry ? "has-entry" : "is-empty-entry",
    ].filter(Boolean).join(" ");
    if (mood) setMoodVars(button, mood);
    const metaLabel = getMetaLabel(date);
    button.setAttribute("aria-label", `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${entry ? `，${mood.label}` : "，未记录"}`);
    button.innerHTML = `${mood ? faceMarkup(mood.id, "calendar") : `<span class="empty-day">${day}</span>`}${metaLabel ? `<span class="date-meta">${metaLabel}</span>` : ""}<span class="day-number">${day}</span>`;
    button.addEventListener("click", () => selectDate(date));
    calendarGrid.appendChild(button);
  }
}

function selectDate(date) {
  state.selectedDate = new Date(date);
  const entry = normalizeEntry(state.entries[dateKey(date)]);
  state.selectedMood = entry?.mood || seedMoodForDate(date.getDate()).id;
  noteInput.value = entry?.note || "";
  saveStatus.textContent = "";
  render();
}

function openEditor() {
  hydrateSelectedEntry();
  state.editorOpen = true;
  render();
}

function closeEditor() {
  state.editorOpen = false;
  saveStatus.textContent = "";
  renderEditorState();
}

function renderEditorState() {
  overlay.hidden = !state.editorOpen;
  entrySheet.hidden = !state.editorOpen;
}

function renderToggles() {
  const monthTerms = getMonthSolarTerms(state.visibleDate);
  const seasonClass = getSeasonClass(state.visibleDate.getMonth());
  solarToggle.classList.remove("season-spring", "season-summer", "season-autumn", "season-winter");
  solarToggle.classList.add(seasonClass);
  solarToggle.title = monthTerms.length ? `本月节气：${monthTerms.join("、")}` : "本月节气";
  solarToggle.setAttribute("data-terms", monthTerms.join(" · "));
  solarToggle.classList.toggle("is-active", state.showSolarTerms);
  solarToggle.setAttribute("aria-pressed", String(state.showSolarTerms));
  lunarToggle.classList.toggle("is-active", state.showLunar);
  lunarToggle.setAttribute("aria-pressed", String(state.showLunar));
}

function renderSolarVideo() {
  solarVideo.play().catch(() => {
    // Some browsers wait for user interaction even when muted.
  });
}

function toggleCalendarOption(option, animatedElement) {
  state[option] = !state[option];
  if (animatedElement) {
    animatedElement.classList.remove("is-bursting");
    void animatedElement.offsetWidth;
    animatedElement.classList.add("is-bursting");
    window.setTimeout(() => animatedElement.classList.remove("is-bursting"), 720);
  }
  render();
}

function changeMonth(direction) {
  state.visibleDate = new Date(state.visibleDate.getFullYear(), state.visibleDate.getMonth() + direction, 1);
  state.selectedDate = new Date(
    state.visibleDate.getFullYear(),
    state.visibleDate.getMonth(),
    Math.min(state.selectedDate.getDate(), new Date(state.visibleDate.getFullYear(), state.visibleDate.getMonth() + 1, 0).getDate()),
  );
  hydrateSelectedEntry();
  render();
}

function saveEntry() {
  const key = dateKey(state.selectedDate);
  state.entries[key] = { mood: state.selectedMood, note: noteInput.value.trim(), updatedAt: new Date().toISOString() };
  localStorage.setItem(storageKey, JSON.stringify(state.entries));
  saveStatus.textContent = "已保存";
  renderCalendar();
}

function hydrateSelectedEntry() {
  const entry = normalizeEntry(state.entries[dateKey(state.selectedDate)]);
  state.selectedMood = entry?.mood || seedMoodForDate(state.selectedDate.getDate()).id;
  noteInput.value = entry?.note || "";
}

function loadEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem(storageKey)) || {};
    Object.keys(entries).forEach((key) => { entries[key] = normalizeEntry(entries[key]); });
    return entries;
  } catch {
    return {};
  }
}

function normalizeEntry(entry) {
  if (!entry) return null;
  const mood = legacyMoodMap[entry.mood] || entry.mood;
  return { ...entry, mood: getMood(mood).id };
}

function getMood(id) {
  return moods.find((mood) => mood.id === id) || moods[0];
}

function seedMoodForDate(day) {
  const pattern = ["blue", "red", "purple", "sunny", "blue", "sunny", "green", "gray", "orange", "pink"];
  return getMood(pattern[(day - 1) % pattern.length]);
}

function getMetaLabel(date) {
  const labels = [];
  if (state.showSolarTerms) {
    const key = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (solarTerms[key]) labels.push(solarTerms[key]);
  }
  if (state.showLunar) labels.push(lunarDayNames[(date.getDate() - 1) % lunarDayNames.length]);
  return labels[0] || "";
}

function getMonthSolarTerms(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return Object.entries(solarTerms).filter(([key]) => key.startsWith(`${month}-`)).map(([, label]) => label);
}

function getSeasonClass(monthIndex) {
  if (monthIndex >= 1 && monthIndex <= 3) return "season-spring";
  if (monthIndex >= 4 && monthIndex <= 7) return "season-summer";
  if (monthIndex >= 8 && monthIndex <= 10) return "season-autumn";
  return "season-winter";
}

function setMoodVars(element, mood) {
  element.style.setProperty("--mood-tone", mood.tone);
}

function faceMarkup(id, size) {
  return `<span class="mooda-face ${size} mood-${id}" aria-hidden="true"><span class="eye left"></span><span class="eye right"></span><span class="mouth"></span><span class="detail detail-one"></span><span class="detail detail-two"></span></span>`;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

function formatReadableDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
