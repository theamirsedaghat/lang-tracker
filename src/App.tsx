import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  CloudOff,
  Database,
  Download,
  FileUp,
  Flame,
  Gauge,
  GraduationCap,
  HardDrive,
  Headphones,
  Home,
  Info,
  Layers3,
  ListChecks,
  LockKeyhole,
  Menu,
  Moon,
  PenLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Wifi,
  X,
} from "lucide-react";
import {
  BOOKS,
  CATEGORIES,
  TASKS_BY_BOOK,
  localDay,
  shiftDate,
  diffDays,
  BOOK_BY_ID,
  initialState,
} from "./catalog.ts";
import {
  bookStats,
  complete,
  completedDays,
  currentPace,
  doneOnDay,
  editSettings,
  forecast,
  groupStats,
  nextTask,
  readBackup,
  recentDays,
  saveReflection,
  statusOnDay,
  targetOnDay,
  totalOnDay,
  totalStats,
  undo,
} from "./engine.ts";
import {
  exportJson,
  getArchives,
  loadState,
  requestDurableStorage,
  restoreArchive,
  saveState,
} from "./storage.ts";
import type {
  AppState,
  Archive,
  CategoryId,
  Reflection,
  Task,
} from "./types.ts";

import { translate, formatNumber, formatDate, formatCalendarMonth, formatTimestamp, WEEK_DAYS, WEEK_SHORT } from "./i18n.ts";
import type { Language } from "./i18n.ts";

type View = "dashboard" | "library" | "calendar" | "insights" | "settings";
const icons: Record<CategoryId, ReactNode> = {
  aef: <BookOpen size={20} />,
  listening: <Headphones size={20} />,
  grammar: <Layers3 size={20} />,
  reading: <BookOpen size={20} />,
  writing: <PenLine size={20} />,
  busuu: <Sparkles size={20} />,
};
const navItems: { id: View; name: string; icon: ReactNode }[] = [
  { id: "dashboard", name: "داشبورد", icon: <Home size={19} /> },
  { id: "library", name: "منابع و درس‌ها", icon: <BookOpen size={19} /> },
  { id: "calendar", name: "تقویم مطالعه", icon: <CalendarDays size={19} /> },
  { id: "insights", name: "تحلیل پیشرفت", icon: <BarChart3 size={19} /> },
  { id: "settings", name: "تنظیمات و پشتیبان", icon: <Settings2 size={19} /> },
];
function Ring({
  value,
  size = 118,
  stroke = 10,
  color = "#6de1d4",
  children,
  language = "fa",
}: {
  value: number;
  language?: Language;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const dash = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${translate("پیشرفت", language)} ${formatNumber(value, language)} ${translate("درصد", language)}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(163,180,215,.16)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={dash}
          strokeDashoffset={
            dash * (1 - Math.max(0, Math.min(100, value)) / 100)
          }
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-middle">
        {children ?? <strong>{formatNumber(value, language)}%</strong>}
      </div>
    </div>
  );
}
function ProgressBar({
  pct,
  color = "#6de1d4",
}: {
  pct: number;
  color?: string;
}) {
  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: color,
        }}
      />
    </div>
  );
}
function CategoryBadge({ cat }: { cat: CategoryId }) {
  const c = CATEGORIES.find((c) => c.id === cat)!;
  return (
    <span
      className="category-symbol"
      style={{ background: `${c.gradient}20`, color: c.gradient }}
    >
      {icons[cat]}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <CircleCheck size={30} />
      <span>{text}</span>
    </div>
  );
}
function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => initialState());
  const language: Language = state.settings.language === "en" ? "en" : "fa";
  const tr = (text: string) => translate(text, language);
  const fNum = (n: number) => formatNumber(n, language);
  const shortDate = (d: string) => formatDate(d, language);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [view, setView] = useState<View>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryId>("aef");
  const [selectedBook, setSelectedBook] = useState("aef2");
  const [visibleMonth, setVisibleMonth] = useState(() =>
    localDay().slice(0, 7),
  );
  const [selectedDay, setSelectedDay] = useState(localDay());
  const [today, setToday] = useState(localDay());
  const [online, setOnline] = useState(navigator.onLine);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [notice, setNotice] = useState("");
  const [rating, setRating] = useState({
    listening: 3,
    reading: 3,
    writing: 3,
    speaking: 3,
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastSave, setLastSave] = useState("");

  useEffect(() => {
    let active = true;
    loadState()
      .then((s) => {
        if (!active) return;
        setState(s ? readBackup(s) : initialState());
        setReady(true);
      })
      .catch((e) => {
        if (active) {
          setStorageError(
            `${tr("ذخیره‌سازی در این مرورگر در دسترس نیست:")} ${String(e.message ?? e)}`,
          );
          setReady(false);
        }
      });
    const refresh = () => setToday(localDay());
    const o = () => setOnline(navigator.onLine);
    const focus = () => refresh();
    document.addEventListener("visibilitychange", focus);
    window.addEventListener("focus", focus);
    window.addEventListener("online", o);
    window.addEventListener("offline", o);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", focus);
      window.removeEventListener("focus", focus);
      window.removeEventListener("online", o);
      window.removeEventListener("offline", o);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    saveState(state)
      .then(() =>
        setLastSave(
          formatTimestamp(new Date().toISOString(), language, true),
        ),
      )
      .catch((e) =>
        setStorageError(`${tr("خطا در ذخیره‌سازی:")} ${String(e.message ?? e)}`),
      );
  }, [state, ready]);
  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme;
  }, [state.settings.theme]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    document.title = language === "fa" ? "English Mastery OS | مسیر یادگیری" : "English Mastery OS | Learning Tracker";
  }, [language]);
  useEffect(() => {
    if (notice) {
      const t = window.setTimeout(() => setNotice(""), 4000);
      return () => window.clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => {
    if (view === "settings" && ready)
      getArchives()
        .then(setArchives)
        .catch(() => {});
  }, [view, ready, state.revision]);

  const totals = useMemo(() => totalStats(state), [state]);
  const day = useMemo(() => statusOnDay(state, today), [state, today]);
  const days = useMemo(() => completedDays(state, today), [state, today]);
  const daysLeft = diffDays(today, state.settings.deadline);
  const duration = Math.max(
    1,
    diffDays(state.settings.startDate, state.settings.deadline),
  );
  const elapsed = Math.max(0, diffDays(state.settings.startDate, today));
  const timeProgress = Math.min(100, Math.round((elapsed / duration) * 100));
  const history = useMemo(() => recentDays(state, 14), [state, today]);
  const refreshMessage = (msg: string) => setNotice(msg);
  function mark(t: Task) {
    if (!ready || storageError) return;
    setState((old) => complete(old, t.id));
    refreshMessage(`${t.label} ${tr("ثبت شد ✓")}`);
  }
  function unmark(t: Task) {
    if (!ready || storageError) return;
    setState((old) => undo(old, t.id));
    refreshMessage(tr("علامت انجام‌دادن برداشته شد."));
  }
  function changeView(v: View) {
    setView(v);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openCategory(c: CategoryId) {
    setSelectedCat(c);
    const b =
      BOOKS.filter((b) => b.category === c).find(
        (b) => bookStats(state, b.id).remaining > 0,
      ) || BOOKS.find((b) => b.category === c);
    if (b) setSelectedBook(b.id);
    changeView("library");
  }
  function edit(changes: Partial<AppState["settings"]>) {
    setState((s) => editSettings(s, changes));
  }
  function updatePlan(
    cat: CategoryId,
    parts: Partial<AppState["settings"]["plans"][CategoryId]>,
  ) {
    const plans = {
      ...state.settings.plans,
      [cat]: { ...state.settings.plans[cat], ...parts },
    };
    edit({ plans });
  }
  function download() {
    exportJson(state);
    edit({ lastExportAt: new Date().toISOString() });
    refreshMessage(tr("فایل پشتیبان دانلود شد؛ آن را خارج از مرورگر نگه دار."));
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5_000_000) {
      refreshMessage(tr("فایل بیش از حد بزرگ است."));
      return;
    }
    try {
      const content = JSON.parse(await file.text());
      const incoming = readBackup(content);
      if (
        !window.confirm(
          tr("تمام داده‌های فعلی با این نسخه جایگزین می‌شود. یک نسخه محلی از وضعیت فعلی نگه داشته می‌شود. ادامه می‌دهی؟"),
        )
      )
        return;
      setBusy(true);
      await saveState(state, true);
      setState({
        ...incoming,
        revision: Math.max(incoming.revision, state.revision) + 1,
      });
      setNotice(tr("نسخه پشتیبان با موفقیت وارد شد."));
      setBusy(false);
    } catch (e) {
      setBusy(false);
      window.alert(
        `${tr("خطا در Import:")} ${tr(String(e instanceof Error ? e.message : e))}`,
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function restore(id: string) {
    if (
      !window.confirm(
        tr("این کار وضعیت فعلی را با نسخه آرشیوشده جایگزین می‌کند. ادامه می‌دهی؟"),
      )
    )
      return;
    try {
      setBusy(true);
      await saveState(state, true);
      const s = readBackup(await restoreArchive(id));
      setState({ ...s, revision: Math.max(state.revision, s.revision) + 1 });
      setNotice(tr("نسخه بازیابی شد."));
    } catch (e) {
      window.alert(tr(String(e instanceof Error ? e.message : e)));
    } finally {
      setBusy(false);
    }
  }
  const health = storageError
    ? tr("ذخیره‌سازی مشکل دارد")
    : ready
      ? tr("ذخیره محلی فعال است")
      : tr("در حال بارگذاری");

  return (
    <div className="app-shell" dir={language === "fa" ? "rtl" : "ltr"}>
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="logo">
          <div className="logo-mark">
            <GraduationCap size={24} />
          </div>
          <div>
            <strong>English Mastery</strong>
            <span>PERSONAL LEARNING OS</span>
          </div>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map((x) => (
            <button
              key={x.id}
              className={`nav-button ${view === x.id ? "active" : ""}`}
              onClick={() => changeView(x.id)}
            >
              {x.icon}
              <span>{tr(x.name)}</span>
              {view === x.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-goal">
            <div className="side-icon">
              <Target size={22} />
            </div>
            <span className="eyebrow">YOUR MISSION</span>
            <strong>Pre-IELTS Foundation</strong>
            <p>{tr("قدم به قدم تا ساختن پایه‌ای قوی")}</p>
            <ProgressBar pct={timeProgress} color="#a5a0fb" />
            <span className="small-muted">
              {fNum(Math.max(daysLeft, 0))} {tr("روز تا پایان برنامه")}</span>
          </div>
          <div className="sidebar-credits">
            <span className="online-dot" />
            Offline-first · v1.1
          </div>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="backdrop"
          onClick={() => setMobileMenu(false)}
          aria-label={tr("بستن منو")}
        />
      )}
      <div className="workarea">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button icon-btn"
              onClick={() => setMobileMenu(true)}
              aria-label={tr("منو")}
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <span>English Mastery OS</span>
              <ChevronLeft size={15} />
              <strong>{tr(navItems.find((n) => n.id === view)?.name ?? "")}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <div className="lang-switch" role="group" aria-label="Language / زبان">
              <button type="button" className={language === "fa" ? "lang-active" : ""} aria-pressed={language === "fa"} onClick={() => edit({ language: "fa" })}>FA</button>
              <button type="button" className={language === "en" ? "lang-active" : ""} aria-pressed={language === "en"} onClick={() => edit({ language: "en" })}>EN</button>
            </div>
            <span className="topbar-date">
              <CalendarDays size={16} />
              {shortDate(today)}
            </span>
            <span className="status-pill">
              <span className="online-dot" />
              {online ? tr("آماده برای استفاده آفلاین") : tr("حالت آفلاین")}
            </span>
            <button
              className="avatar"
              aria-label={tr("تنظیمات")}
              onClick={() => changeView("settings")}
            >
              <Settings2 size={19} />
            </button>
          </div>
        </header>
        <main className="main-content">
          {storageError && (
            <div className="warning">
              <LockKeyhole size={20} />
              <div>
                <strong>{tr(storageError)}</strong>
                <p>
                  {tr("برای جلوگیری از از دست رفتن اطلاعات، ثبت درس غیرفعال است. از مرورگر معمولی استفاده کن و فضای ذخیره را بررسی کن.")}</p>
              </div>
            </div>
          )}
          {!ready && !storageError && (
            <div className="loading">{tr("در حال آماده‌سازی اطلاعات مطالعه...")}</div>
          )}
          {ready && view === "dashboard" && (
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">YOUR DAILY COMMAND CENTER</span>
                  <h1>
                    {tr("امروز یک قدم جلوتر")}{" "}<span>✦</span>
                  </h1>
                  <p>
                    {tr("پیشرفت واقعی از درس‌های کوچک و استمرار روزانه ساخته می‌شود.")}</p>
                </div>
                <span className="date-chip">
                  <CalendarDays size={17} />
                  {shortDate(today)}
                </span>
              </div>
              <div className="hero-grid">
                <section className="hero-card">
                  <div className="hero-flare" />
                  <div className="hero-copy">
                    <span className="hero-tag">
                      <Flame size={15} /> PRE-IELTS FOUNDATION
                    </span>
                    <h2>
                      {tr("مسیرت تا پایان")}<br />
                      <em>Pre-IELTS</em>
                    </h2>
                    <p>{tr("زمان باقی‌مانده مهم است؛ پیشرفت واقعی مهم‌تر.")}</p>
                    <div className="hero-bottom">
                      <span>
                        <strong>{fNum(elapsed)}</strong> {tr("روز سپری‌شده")}</span>
                      <span>
                        <strong>{fNum(Math.max(duration - elapsed, 0))}</strong>{" "}
                        {tr("روز از برنامه مانده")}</span>
                    </div>
                  </div>
                  <div className="hero-ring">
                    <Ring
                      language={language}
                      value={timeProgress}
                      size={164}
                      stroke={12}
                      color="#7de0d5"
                    >
                      <div className="countdown">
                        <strong>{fNum(Math.max(0, daysLeft))}</strong>
                        <span>{tr("روز مانده")}</span>
                      </div>
                    </Ring>
                  </div>
                </section>
                <div className="kpi-stack">
                  <div className="metric">
                    <span className="metric-icon blue">
                      <BookOpen size={21} />
                    </span>
                    <div>
                      <span className="metric-label">{tr("باقی‌مانده کل منابع")}</span>
                      <div className="metric-value">
                        {fNum(totals.remaining)}{" "}
                        <small>{tr("از")}{" "}{fNum(totals.total)}</small>
                      </div>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-icon teal">
                      <CheckCheck size={21} />
                    </span>
                    <div>
                      <span className="metric-label">{tr("روزهای کامل مطالعه")}</span>
                      <div className="metric-value">
                        {fNum(days.full)} <small>{tr("روز کامل")}</small>
                      </div>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-icon pink">
                      <Activity size={21} />
                    </span>
                    <div>
                      <span className="metric-label">{tr("روزهای دارای فعالیت")}</span>
                      <div className="metric-value">
                        {fNum(days.active)} <small>{tr("روز فعال")}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-grid">
                <section className="panel today-panel">
                  <SectionHead
                    eyebrow="DAILY ROUTINE"
                    title={tr("برنامه امروز")}
                    action={
                      <span
                        className={`pill ${day.full ? "pill-success" : ""}`}
                      >
                        {day.rest
                          ? tr("روز استراحت")
                          : day.full
                            ? tr("امروز کامل شد ✓")
                            : `${fNum(day.totalDone)} / ${fNum(day.totalGoal)} ${tr("درس")}`}
                      </span>
                    }
                  />
                  <p className="section-description">
                    {tr("برای کامل‌شدن امروز، باید تمام اهداف برنامه‌ریزی‌شده همین روز ثبت شوند.")}</p>
                  <div className="today-goals">
                    {day.requirements.map((req) => {
                      const cat = CATEGORIES.find(
                        (x) => x.id === req.category,
                      )!;
                      const next = nextTask(state, req.category);
                      const completed = req.done >= req.target;
                      const count = Math.min(req.done, req.target);
                      return (
                        <div
                          className={`daily-row ${completed ? "row-complete" : ""}`}
                          key={req.category}
                        >
                          <CategoryBadge cat={req.category} />
                          <div className="daily-body">
                            <div className="daily-title">
                              <strong>{cat.name}</strong>
                              <span>
                                {fNum(count)}/{fNum(req.target)}
                              </span>
                            </div>
                            <ProgressBar
                              pct={(count / req.target) * 100}
                              color={cat.gradient}
                            />
                            <span className="daily-next">
                              {completed
                                ? tr("هدف امروز انجام شد")
                                : next
                                  ? `${BOOK_BY_ID.get(next.bookId)?.title} · ${next.label}`
                                  : tr("پایان مجموعه")}
                            </span>
                          </div>
                          <button
                            className={`action-btn ${completed ? "action-done" : ""}`}
                            disabled={completed || !next || !!storageError}
                            onClick={() => next && mark(next)}
                            title={
                              completed
                                ? tr("هدف امروز انجام شده")
                                : `${tr("ثبت")} ${next?.label ?? ""}`
                            }
                          >
                            {completed ? (
                              <Check size={20} />
                            ) : (
                              <Plus size={20} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                    {day.requirements.length === 0 && (
                      <Empty text={tr("امروز درس اجباری نداری. می‌توانی مرور یا استراحت کنی.")} />
                    )}
                  </div>
                  <div className="today-footer">
                    <span>
                      <Info size={15} /> {tr("درس‌های اضافه هم قابل ثبت هستند، اما هدف روز را تغییر نمی‌دهند.")}</span>
                    <button
                      className="text-link"
                      onClick={() => changeView("library")}
                    >
                      {tr("مشاهده همه درس‌ها")}{" "}<ArrowLeft size={16} />
                    </button>
                  </div>
                </section>
                <section className="panel overview-panel">
                  <SectionHead
                    eyebrow="OVERALL COMPLETION"
                    title={tr("پیشرفت کلی")}
                  />
                  <div className="overall-ring">
                    <Ring
                      language={language}
                      value={totals.percent}
                      size={188}
                      stroke={13}
                      color="#7ae3d8"
                    >
                      <div className="ring-stats">
                        <strong>{fNum(totals.percent)}%</strong>
                        <span>{tr("تکمیل کل منابع")}</span>
                      </div>
                    </Ring>
                  </div>
                  <div className="overview-stats">
                    <div>
                      <strong>{fNum(totals.done)}</strong>
                      <span>{tr("انجام‌شده")}</span>
                    </div>
                    <div className="v-divider" />
                    <div>
                      <strong>{fNum(totals.remaining)}</strong>
                      <span>{tr("باقی‌مانده")}</span>
                    </div>
                  </div>
                  <div className="overview-note">
                    <ShieldCheck size={17} /> {health}
                    {lastSave && ` · ${lastSave}`}
                  </div>
                </section>
              </div>
              <section className="panel full-width">
                <SectionHead
                  eyebrow="YOUR LEARNING PATH"
                  title={tr("پیشرفت مجموعه‌ها")}
                  action={
                    <button
                      className="text-link"
                      onClick={() => changeView("library")}
                    >
                      {tr("همه منابع")}{" "}<ArrowLeft size={16} />
                    </button>
                  }
                />
                <div className="category-grid">
                  {CATEGORIES.map((c) => {
                    const st = groupStats(state, c.id);
                    return (
                      <button
                        className="category-card"
                        key={c.id}
                        onClick={() => openCategory(c.id)}
                      >
                        <div className="category-top">
                          <CategoryBadge cat={c.id} />
                          <span className="category-pct">
                            {fNum(st.percent)}%
                          </span>
                        </div>
                        <strong>{c.name}</strong>
                        <span className="category-desc">{tr(c.description)}</span>
                        <ProgressBar pct={st.percent} color={c.gradient} />
                        <div className="category-bottom">
                          <span>
                            {fNum(st.done)} / {fNum(st.total)} {language === "fa" ? "تکمیل‌شده" : "completed"}
                          </span>
                          <ChevronLeft size={16} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="panel full-width">
                <SectionHead
                  eyebrow="LAST 14 DAYS"
                  title={tr("ریتم مطالعه")}
                  action={
                    <button
                      className="text-link"
                      onClick={() => changeView("insights")}
                    >
                      {tr("تحلیل بیشتر")}{" "}<ArrowLeft size={16} />
                    </button>
                  }
                />
                <div className="bar-chart">
                  {history.map((h) => (
                    <div
                      className="bar-column"
                      key={h.date}
                      title={`${h.date} · ${h.count} ${tr("درس")}`}
                    >
                      <span className="bar-tooltip">{fNum(h.count)}</span>
                      <div
                        className="bar-line"
                        style={{
                          height: `${Math.max(h.count > 0 ? 5 : 2, Math.min(100, (h.count / Math.max(1, ...history.map((x) => x.count))) * 100))}%`,
                          background: h.full ? "#6de1d4" : "#8b83f1",
                        }}
                      />
                      <small>
                        {formatDate(h.date, language, { day: "numeric" })}
                      </small>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <span>
                    <i className="legend-teal" /> {tr("روز کامل")}</span>
                  <span>
                    <i className="legend-purple" /> {tr("فعالیت جزئی")}</span>
                  <span className="muted">
                    {tr("درس‌های قبل از نصب برنامه جزو تاریخچه روزانه نیستند.")}</span>
                </div>
              </section>
            </>
          )}
          {ready && view === "library" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">YOUR RESOURCE LIBRARY</span>
                <h1>{tr("منابع و درس‌ها")}</h1>
                <p>
                  {tr("روی هر درس ضربه بزن تا انجام‌شدن آن ثبت یا اصلاح شود. تمام محاسبات بلافاصله تغییر می‌کنند.")}</p>
              </div>
              <div className="library-summary">
                <span>
                  <BookOpen size={20} />
                  <strong>{fNum(totals.total)}</strong> {tr("کل موارد")}</span>
                <span>
                  <CircleCheck size={20} />
                  <strong>{fNum(totals.done)}</strong> {tr("انجام‌شده")}</span>
                <span>
                  <Clock3 size={20} />
                  <strong>{fNum(totals.remaining)}</strong> {tr("باقی‌مانده")}</span>
              </div>
              <div className="filter-row">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`filter-button ${selectedCat === c.id ? "filter-active" : ""}`}
                    onClick={() => {
                      setSelectedCat(c.id);
                      setSelectedBook(
                        BOOKS.find((b) => b.category === c.id)!.id,
                      );
                    }}
                  >
                    {icons[c.id]}
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
              <div className="library-layout">
                <div className="book-rail">
                  {BOOKS.filter((b) => b.category === selectedCat).map((b) => {
                    const stat = bookStats(state, b.id);
                    return (
                      <button
                        key={b.id}
                        className={`book-choice ${selectedBook === b.id ? "book-choice-active" : ""}`}
                        onClick={() => setSelectedBook(b.id)}
                      >
                        <span className="book-index">
                          {BOOKS.filter(
                            (x) => x.category === selectedCat,
                          ).indexOf(b) + 1}
                        </span>
                        <span className="book-choice-main">
                          <strong>{b.title}</strong>
                          <small>
                            {fNum(stat.done)}/{fNum(stat.total)} {tr("تکمیل‌شده")}</small>
                          <ProgressBar pct={stat.percent} color={b.color} />
                        </span>
                        <ChevronLeft size={16} />
                      </button>
                    );
                  })}
                </div>
                <div className="panel lesson-panel">
                  {(() => {
                    const b = BOOK_BY_ID.get(selectedBook) || BOOKS[0];
                    const tasks = TASKS_BY_BOOK.get(b.id) ?? [];
                    const st = bookStats(state, b.id);
                    const next = tasks.find((t) => !state.records[t.id]);
                    return (
                      <>
                        <div className="lesson-heading">
                          <div>
                            <span className="eyebrow">LESSON TRACKER</span>
                            <h2>{b.title}</h2>
                            <p>{b.subtitle}</p>
                          </div>
                          <Ring
                      language={language}
                            size={98}
                            stroke={9}
                            color={b.color}
                            value={st.percent}
                          />
                        </div>
                        <div className="lesson-summary">
                          <span>{fNum(st.done)} {tr("انجام‌شده")}</span>
                          <span>{fNum(st.remaining)} {tr("باقی‌مانده")}</span>
                          <span>{fNum(st.percent)}{tr("% پیشرفت")}</span>
                        </div>
                        <div className="lesson-actions">
                          <span>{tr("هر کارت = یک درس/یونیت/چپتر قابل ثبت")}</span>
                          {next && (
                            <button
                              className="primary small"
                              onClick={() => mark(next)}
                              disabled={!!storageError}
                            >
                              <Plus size={15} /> {tr("انجام")}{" "}{next.label}
                            </button>
                          )}
                        </div>
                        <div className="lesson-grid">
                          {tasks.map((t) => (
                            <button
                              key={t.id}
                              className={`lesson-item ${state.records[t.id] ? "lesson-done" : ""}`}
                              onClick={() =>
                                state.records[t.id] ? unmark(t) : mark(t)
                              }
                              disabled={!!storageError}
                              title={`${t.label} · ${state.records[t.id] ? tr("برداشتن تیک") : tr("ثبت انجام")}`}
                            >
                              <span>{t.label}</span>
                              {state.records[t.id] ? (
                                <Check size={16} />
                              ) : (
                                <span className="lesson-empty-dot" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="lesson-note">
                          <Info size={17} /> {tr("تیک‌های اولیه (مثلاً Basic Grammar ۱ تا ۹) به عنوان پیشرفت قبلی ذخیره شده‌اند و به اشتباه به فعالیت امروز اضافه نمی‌شوند.")}</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
          {ready && view === "calendar" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">CONSISTENCY & ACCOUNTABILITY</span>
                <h1>{tr("تقویم مطالعه")}</h1>
                <p>
                  {tr("روز کامل یعنی همه اهداف تعیین‌شده همان روز انجام شده باشند، نه صرفاً مطالعه یکی دو منبع.")}</p>
              </div>
              <div className="calendar-grid">
                <section className="panel">
                  <div className="calendar-toolbar">
                    <h2>
                      {formatCalendarMonth(visibleMonth, language)}
                    </h2>
                    <div className="calendar-actions">
                      <button
                        className="icon-btn"
                        onClick={() =>
                          setVisibleMonth(shiftMonth(visibleMonth, -1))
                        }
                        aria-label={tr("ماه قبل")}
                      >
                        {language === "fa" ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                      </button>
                      <button
                        className="outline small"
                        onClick={() => {
                          setVisibleMonth(today.slice(0, 7));
                          setSelectedDay(today);
                        }}
                      >
                        {tr("امروز")}</button>
                      <button
                        className="icon-btn"
                        onClick={() =>
                          setVisibleMonth(shiftMonth(visibleMonth, 1))
                        }
                        aria-label={tr("ماه بعد")}
                      >
                        {language === "fa" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="month-grid">
                    {WEEK_SHORT[language].map((x, i) => (
                      <div className="month-weekday" key={i}>
                        {x}
                      </div>
                    ))}
                    {(() => {
                      const [y, m] = visibleMonth.split("-").map(Number);
                      const max = new Date(y, m, 0).getDate();
                      const first = new Date(y, m - 1, 1).getDay();
                      const offset = language === "fa" ? (first + 1) % 7 : first;
                      return [...Array(offset)]
                        .map((_, i) => <div key={`blank${i}`} />)
                        .concat(
                          Array.from({ length: max }, (_, i) => {
                            const d = `${visibleMonth}-${String(i + 1).padStart(2, "0")}`;
                            const s = statusOnDay(state, d);
                            const isFuture = d > today;
                            return (
                              <button
                                key={d}
                                className={`calendar-day ${selectedDay === d ? "selected" : ""} ${d === today ? "is-today" : ""} ${s.full ? "is-full" : s.hasActivity ? "is-partial" : s.rest ? "is-rest" : d < today ? "is-missed" : ""}`}
                                onClick={() => setSelectedDay(d)}
                              >
                                <span>{fNum(i + 1)}</span>
                                {!isFuture &&
                                  (s.full ? (
                                    <Check size={15} />
                                  ) : s.hasActivity ? (
                                    <i className="day-dot" />
                                  ) : null)}
                              </button>
                            );
                          }),
                        );
                    })()}
                  </div>
                  <div className="calendar-legend">
                    <span>
                      <i className="legend-teal" /> {tr("کامل")}</span>
                    <span>
                      <i className="legend-purple" /> {tr("جزئی")}</span>
                    <span>
                      <i className="legend-gray" /> {tr("بدون برنامه")}</span>
                  </div>
                </section>
                <section className="panel day-details">
                  <span className="eyebrow">DAY DETAILS</span>
                  <h2>{shortDate(selectedDay)}</h2>
                  {language === "fa" && <p className="hint">میلادی: {formatDate(selectedDay, "en")}</p>}
                  {(() => {
                    const d = statusOnDay(state, selectedDay);
                    return (
                      <>
                        <div
                          className={`day-state ${d.full ? "complete" : ""}`}
                        >
                          {d.rest
                            ? tr("روز آزاد / استراحت")
                            : d.full
                              ? tr("تمام اهداف این روز انجام شده‌اند")
                              : d.hasActivity
                                ? tr("مطالعه انجام شده؛ همه اهداف کامل نیستند")
                                : selectedDay > today
                                  ? tr("روز پیش رو")
                                  : tr("اهداف این روز کامل نشده‌اند")}
                        </div>
                        <div className="day-detail-stats">
                          <strong>
                            {fNum(totalOnDay(state, selectedDay))}
                          </strong>
                          <span>{tr("درس ثبت‌شده در این روز")}</span>
                        </div>
                        <div className="detail-list">
                          {d.requirements.map((req) => (
                            <div key={req.category}>
                              <span>
                                {
                                  CATEGORIES.find((c) => c.id === req.category)
                                    ?.name
                                }
                              </span>
                              <strong>
                                {fNum(req.done)} / {fNum(req.target)}{" "}
                                {req.done >= req.target ? "✓" : ""}
                              </strong>
                            </div>
                          ))}
                        </div>
                        {d.rest && (
                          <p className="hint">
                            {tr("برای این روز طبق تنظیمات هدف الزامی وجود ندارد.")}</p>
                        )}
                      </>
                    );
                  })()}
                </section>
              </div>
            </>
          )}
          {ready && view === "insights" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">MEASURE WHAT MATTERS</span>
                <h1>{tr("تحلیل پیشرفت")}</h1>
                <p>
                  {tr("تعداد درس‌ها عملکرد اجرایی را نشان می‌دهد؛ ارزیابی مهارت‌ها را جداگانه ثبت کن تا این دو با هم اشتباه نشوند.")}</p>
              </div>
              <div className="insight-kpis">
                <div className="metric">
                  <span className="metric-icon teal">
                    <CheckCheck />
                  </span>
                  <div>
                    <span className="metric-label">{tr("روزهای کامل")}</span>
                    <div className="metric-value">{fNum(days.full)}</div>
                  </div>
                </div>
                <div className="metric">
                  <span className="metric-icon blue">
                    <Activity />
                  </span>
                  <div>
                    <span className="metric-label">{tr("روزهای مطالعه")}</span>
                    <div className="metric-value">{fNum(days.active)}</div>
                  </div>
                </div>
                <div className="metric">
                  <span className="metric-icon pink">
                    <TrendingUp />
                  </span>
                  <div>
                    <span className="metric-label">{tr("درس‌های ۱۴ روز اخیر")}</span>
                    <div className="metric-value">
                      {fNum(history.reduce((n, d) => n + d.count, 0))}
                    </div>
                  </div>
                </div>
              </div>
              <section className="panel">
                <SectionHead
                  eyebrow="PACE TRACKER"
                  title={tr("سرعت فعلی و پیش‌بینی پایان")}
                />
                <div className="pace-table">
                  <div className="pace-row pace-header">
                    <span>{tr("مجموعه")}</span>
                    <span>{tr("باقی‌مانده")}</span>
                    <span>{tr("سرعت واقعی / هفته")}</span>
                    <span>{tr("تخمین زمان پایان")}</span>
                  </div>
                  {CATEGORIES.map((c) => {
                    const stats = groupStats(state, c.id);
                    const speed = currentPace(state, c.id);
                    const f = forecast(state, c.id);
                    return (
                      <div className="pace-row" key={c.id}>
                        <strong>{c.name}</strong>
                        <span>{fNum(stats.remaining)}</span>
                        <span>
                          {speed > 0
                            ? fNum(Math.round(speed * 10) / 10)
                            : tr("هنوز داده کافی نیست")}
                        </span>
                        <span>
                          {f.weeks === 0
                            ? tr("به پایان رسیده")
                            : f.weeks === null
                              ? tr("هدف هفتگی خاموش")
                              : `${fNum(f.weeks)} ${tr("هفته ·")} ${f.method === "planned" ? tr("برنامه فعلی") : tr("سرعت اخیر")}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="hint">
                  {tr("تخمین‌ها تقریبی‌اند. برای گرامر، با عبور از Basic سرعت هدف به یک یونیت در روز تغییر می‌کند؛ اعداد روزهای مطالعه لزوماً با روزهای تقویمی یکی نیستند.")}</p>
              </section>
              <div className="content-grid">
                <section className="panel">
                  <SectionHead
                    eyebrow="LEARNING CONSISTENCY"
                    title={tr("فعالیت ۱۴ روز اخیر")}
                  />
                  <div className="bar-chart big-chart">
                    {history.map((h) => (
                      <div className="bar-column" key={h.date}>
                        <span className="bar-tooltip">{fNum(h.count)}</span>
                        <div
                          className="bar-line"
                          style={{
                            height: `${Math.max(2, (h.count / Math.max(1, ...history.map((x) => x.count))) * 100)}%`,
                            background: h.full ? "#6de1d4" : "#8b83f1",
                          }}
                        />
                        <small>
                          {formatDate(h.date, language, { day: "numeric" })}
                        </small>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="panel">
                  <SectionHead
                    eyebrow="WEEKLY SKILL CHECK"
                    title={tr("ارزیابی شخصی ۴ مهارت")}
                  />
                  <p className="section-description">
                    {tr("امتیاز ۱ تا ۵ صرفاً احساس فعلی تو درباره مهارت‌هاست، نه آزمون استاندارد CEFR یا نمره IELTS.")}</p>
                  <div className="rating-fields">
                    {(
                      ["listening", "reading", "writing", "speaking"] as const
                    ).map((skill) => (
                      <div key={skill}>
                        <label htmlFor={skill}>
                          {skill[0].toUpperCase() + skill.slice(1)}
                        </label>
                        <div className="rating-inline">
                          <input
                            id={skill}
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={rating[skill]}
                            onChange={(e) =>
                              setRating({
                                ...rating,
                                [skill]: Number(e.target.value),
                              })
                            }
                          />
                          <strong>{fNum(rating[skill])}{tr("/۵")}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                  <textarea
                    placeholder={tr("این هفته کجا پیشرفت داشتم؟ چه چیزی دشوار بود؟")}
                    value={rating.note}
                    onChange={(e) =>
                      setRating({ ...rating, note: e.target.value })
                    }
                    maxLength={2000}
                  />
                  <button
                    className="primary"
                    onClick={() => {
                      const item: Reflection = { ...rating, date: today };
                      setState((s) => saveReflection(s, item));
                      refreshMessage(tr("ارزیابی این هفته ثبت شد."));
                    }}
                  >
                    <Check size={17} /> {tr("ثبت ارزیابی امروز")}</button>
                  <p className="hint">
                    {fNum(state.reflections.length)} {tr("ارزیابی ثبت شده. ثبت مجدد در یک روز، ارزیابی همان روز را به‌روزرسانی می‌کند.")}</p>
                </section>
              </div>
              {state.reflections.length > 0 && (
                <section className="panel">
                  <SectionHead
                    eyebrow="SELF-ASSESSMENT HISTORY"
                    title={tr("آخرین ارزیابی‌ها")}
                  />
                  <div className="reflection-list">
                    {[...state.reflections]
                      .reverse()
                      .slice(0, 8)
                      .map((r) => (
                        <div key={r.date}>
                          <strong>{shortDate(r.date)}</strong>
                          <span>
                            Listening {r.listening}/5 · Reading {r.reading}/5 ·
                            Writing {r.writing}/5 · Speaking {r.speaking}/5
                          </span>
                          {r.note && <p>{r.note}</p>}
                        </div>
                      ))}
                  </div>
                </section>
              )}
            </>
          )}
          {ready && view === "settings" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">YOUR WORKSPACE, YOUR RULES</span>
                <h1>{tr("تنظیمات و امنیت داده‌ها")}</h1>
                <p>
                  {tr("همه تغییرات به‌صورت محلی ذخیره می‌شوند. برای محافظت در برابر حذف مرورگر، نسخه مستقل JSON تهیه کن.")}</p>
              </div>
              <div className="settings-layout">
                <section className="panel">
                  <SectionHead
                    eyebrow="MISSION SETTINGS"
                    title={tr("مهلت و ظاهر برنامه")}
                  />
                  <div className="setting-field">
                    <label>{tr("شروع برنامه")}</label>
                    <input
                      type="date"
                      value={state.settings.startDate}
                      max={state.settings.deadline}
                      onChange={(e) => {
                        if (e.target.value) edit({ startDate: e.target.value });
                      }}
                    />
                  </div>
                  <div className="setting-field">
                    <label>{tr("پایان Pre-IELTS")}</label>
                    <input
                      type="date"
                      value={state.settings.deadline}
                      min={state.settings.startDate}
                      onChange={(e) => {
                        if (e.target.value) edit({ deadline: e.target.value });
                      }}
                    />
                  </div>
                  <div className="deadline-quick">
                    <button
                      className="outline"
                      onClick={() =>
                        edit({
                          deadline: shiftDate(state.settings.startDate, 145),
                        })
                      }
                    >
                      {tr("۱۴۵ روز از شروع")}</button>
                    <button
                      className="outline"
                      onClick={() =>
                        edit({
                          deadline: shiftDate(state.settings.startDate, 150),
                        })
                      }
                    >
                      {tr("۱۵۰ روز از شروع")}</button>
                  </div>
                  <div className="setting-field">
                    <label>{language === "fa" ? "زبان برنامه / Language" : "App language / زبان"}</label>
                    <div className="theme-options">
                      <button className={`outline ${language === "fa" ? "selected-option" : ""}`} onClick={() => edit({ language: "fa" })}>فارسی</button>
                      <button className={`outline ${language === "en" ? "selected-option" : ""}`} onClick={() => edit({ language: "en" })}>English</button>
                    </div>
                  </div>
                  <div className="setting-field">
                    <label>{tr("پوسته برنامه")}</label>
                    <div className="theme-options">
                      <button
                        className={`outline ${state.settings.theme === "dark" ? "selected-option" : ""}`}
                        onClick={() => edit({ theme: "dark" })}
                      >
                        <Moon size={17} /> {tr("تیره")}</button>
                      <button
                        className={`outline ${state.settings.theme === "light" ? "selected-option" : ""}`}
                        onClick={() => edit({ theme: "light" })}
                      >
                        <Sun size={17} /> {tr("روشن")}</button>
                    </div>
                  </div>
                </section>
                <section className="panel">
                  <SectionHead
                    eyebrow="DATA PROTECTION"
                    title={tr("پشتیبان‌گیری و بازیابی")}
                  />
                  <div className="backup-alert">
                    <ShieldCheck size={22} />
                    <div>
                      <strong>{tr("ذخیره خودکار روشن است")}</strong>
                      <p>
                        {tr("پس از هر تغییر، داده‌ها به IndexedDB می‌روند. نسخه‌های بازیابی داخل همین مرورگر هم نگهداری می‌شوند، نه در یک محل مستقل.")}</p>
                    </div>
                  </div>
                  <div className="backup-buttons">
                    <button className="primary" onClick={download}>
                      <Download size={18} /> {tr("دانلود فایل Backup")}</button>
                    <button
                      className="outline"
                      onClick={() => fileRef.current?.click()}
                    >
                      <FileUp size={18} /> {tr("بازیابی از فایل")}</button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".json,application/json"
                      hidden
                      onChange={(e) => void importFile(e.target.files?.[0])}
                    />
                  </div>
                  <button
                    className="text-link"
                    onClick={async () =>
                      refreshMessage(
                        (await requestDurableStorage())
                          ? tr("درخواست فضای ذخیره پایدار پذیرفته شد.")
                          : tr("مرورگر فضای ذخیره پایدار را تأیید نکرد."),
                      )
                    }
                  >
                    {tr("درخواست محافظت بیشتر از فضای ذخیره")}{" "}<ShieldCheck size={16} />
                  </button>
                  <p className="hint">
                    {tr("آخرین خروجی خارجی:")}{" "}
                    {state.settings.lastExportAt
                      ? formatTimestamp(state.settings.lastExportAt, language)
                      : tr("هنوز تهیه نشده")}{" "}
                    {tr("· فایل خارجی را روی حافظه دیگری هم نگه دار.")}</p>
                </section>
              </div>
              <section className="panel">
                <SectionHead
                  eyebrow="DAILY SCHEDULING"
                  title={tr("اهداف روزانه و هفتگی")}
                />
                <p className="section-description">
                  {tr("هر روز فقط وقتی کامل است که تمام دسته‌های فعال و برنامه‌ریزی‌شده در آن روز به هدف خود برسند. روز یکشنبه پیش‌فرض استراحت است.")}</p>
                <div className="plan-list">
                  {CATEGORIES.map((c) => {
                    const p = state.settings.plans[c.id];
                    return (
                      <div className="plan-row" key={c.id}>
                        <div className="plan-info">
                          <CategoryBadge cat={c.id} />
                          <div>
                            <strong>{c.name}</strong>
                            <small>
                              {c.id === "grammar"
                                ? tr("Basic: هدف روزانه جدا · Intermediate: هدف روزانه جدا")
                                : tr("تعداد درس در روزهای انتخاب‌شده")}
                            </small>
                          </div>
                        </div>
                        <div className="week-switches">
                          {(language === "fa" ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6]).map((d) => (
                            <button
                              key={d}
                              className={
                                p.days.includes(d) && p.enabled
                                  ? "day-enabled"
                                  : ""
                              }
                              title={WEEK_DAYS[language][d]}
                              onClick={() =>
                                updatePlan(c.id, {
                                  days: p.days.includes(d)
                                    ? p.days.filter((x) => x !== d)
                                    : [...p.days, d],
                                })
                              }
                            >
                              {language === "fa" ? ["ی", "د", "س", "چ", "پ", "ج", "ش"][d] : WEEK_SHORT.en[d]}
                            </button>
                          ))}
                        </div>
                        <div className="plan-controls">
                          {c.id === "grammar" ? (
                            <>
                              <label>
                                Basic{" "}
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={state.settings.basicPerDay}
                                  onChange={(e) =>
                                    edit({
                                      basicPerDay: Math.min(
                                        10,
                                        Math.max(
                                          1,
                                          Number(e.target.value) || 1,
                                        ),
                                      ),
                                    })
                                  }
                                />
                              </label>
                              <label>
                                Intermediate{" "}
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={state.settings.intermediatePerDay}
                                  onChange={(e) =>
                                    edit({
                                      intermediatePerDay: Math.min(
                                        10,
                                        Math.max(
                                          1,
                                          Number(e.target.value) || 1,
                                        ),
                                      ),
                                    })
                                  }
                                />
                              </label>
                            </>
                          ) : (
                            <label>
                              {tr("هدف")}{" "}
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={p.perDay}
                                onChange={(e) =>
                                  updatePlan(c.id, {
                                    perDay: Math.min(
                                      20,
                                      Math.max(1, Number(e.target.value) || 1),
                                    ),
                                  })
                                }
                              />
                            </label>
                          )}
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={p.enabled}
                              onChange={(e) =>
                                updatePlan(c.id, { enabled: e.target.checked })
                              }
                            />
                            <span>{tr("فعال")}</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="panel">
                <SectionHead
                  eyebrow="LOCAL RECOVERY POINTS"
                  title={tr("نسخه‌های بازیابی خودکار")}
                  action={
                    <button
                      className="outline small"
                      onClick={() => getArchives().then(setArchives)}
                    >
                      <RefreshCw size={15} /> {tr("تازه‌سازی")}</button>
                  }
                />
                <p className="section-description">
                  {tr("یک نسخه به‌روزشونده برای هر روز و نسخه‌هایی از هر ۱۵ تغییر ذخیره می‌شود. این‌ها در همان مرورگر هستند و جای فایل Backup را نمی‌گیرند.")}</p>
                <div className="archive-list">
                  {archives.slice(0, 10).map((a) => (
                    <div key={a.id}>
                      <span>
                        <Database size={16} />
                        <span>
                          <strong>{tr(a.reason)}</strong>
                          <small>
                            {formatTimestamp(a.at, language)}
                          </small>
                        </span>
                      </span>
                      <button
                        className="outline small"
                        disabled={busy}
                        onClick={() => void restore(a.id)}
                      >
                        <RotateCcw size={15} /> {tr("بازیابی")}</button>
                    </div>
                  ))}
                  {archives.length === 0 && (
                    <Empty text={tr("هنوز نسخه بازیابی موجود نیست.")} />
                  )}
                </div>
              </section>
              <div className="settings-footer">
                <LockKeyhole size={18} />
                <p>
                  {tr("این نسخه بدون حساب کاربری و بدون همگام‌سازی بین دستگاه‌هاست. برای انتقال داده از Export/Import استفاده کن. به‌روزرسانی کد باید ساختار داده را حفظ کند؛ در آینده می‌توانیم مهاجرت نسخه‌های دیتابیس را به برنامه اضافه کنیم.")}</p>
              </div>
            </>
          )}
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
          <button onClick={() => setNotice("")} aria-label={tr("بستن")}>
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
function shiftMonth(month: string, offset: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 15);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
