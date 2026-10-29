/** Presentation only: task IDs, dates stored as YYYY-MM-DD, and backup schema never change. */
export type Language = 'fa' | 'en'

const EN: Record<string, string> = {
  'یکشنبه':'Sunday', 'دوشنبه':'Monday', 'سه‌شنبه':'Tuesday', 'چهارشنبه':'Wednesday', 'پنجشنبه':'Thursday', 'جمعه':'Friday', 'شنبه':'Saturday',
  'داشبورد':'Dashboard', 'منابع و درس‌ها':'Resources & Lessons', 'تقویم مطالعه':'Study Calendar', 'تحلیل پیشرفت':'Progress Insights', 'تنظیمات و پشتیبان':'Settings & Backups',
  'پیشرفت':'Progress', 'درصد':'percent', 'ذخیره‌سازی در این مرورگر در دسترس نیست:':'Storage is unavailable in this browser:', 'خطا در ذخیره‌سازی:':'Could not save changes:',
  'ثبت شد ✓':'completed ✓', 'علامت انجام‌دادن برداشته شد.':'Completion removed.', 'فایل پشتیبان دانلود شد؛ آن را خارج از مرورگر نگه دار.':'Backup downloaded. Keep a copy outside this browser.',
  'فایل بیش از حد بزرگ است.':'This file is too large.',
  'تمام داده‌های فعلی با این نسخه جایگزین می‌شود. یک نسخه محلی از وضعیت فعلی نگه داشته می‌شود. ادامه می‌دهی؟':'This backup will replace your current data. A local archive of the current state will be kept. Continue?',
  'نسخه پشتیبان با موفقیت وارد شد.':'Backup imported successfully.', 'خطا در Import:':'Import error:',
  'این کار وضعیت فعلی را با نسخه آرشیوشده جایگزین می‌کند. ادامه می‌دهی؟':'This will replace your current data with the selected archived version. Continue?',
  'نسخه بازیابی شد.':'Archive restored.', 'ذخیره‌سازی مشکل دارد':'Storage needs attention', 'ذخیره محلی فعال است':'Local saving is active', 'در حال بارگذاری':'Loading',
  'قدم به قدم تا ساختن پایه‌ای قوی':'One step at a time toward a stronger foundation', 'روز تا پایان برنامه':'days left in your plan',
  'بستن منو':'Close menu', 'منو':'Menu', 'آماده برای استفاده آفلاین':'Offline-ready', 'حالت آفلاین':'Offline mode', 'تنظیمات':'Settings',
  'برای جلوگیری از از دست رفتن اطلاعات، ثبت درس غیرفعال است. از مرورگر معمولی استفاده کن و فضای ذخیره را بررسی کن.':'To prevent data loss, completing lessons is disabled. Use a regular browser window and check available storage.',
  'در حال آماده‌سازی اطلاعات مطالعه...':'Preparing your study data...', 'امروز یک قدم جلوتر':'One step further today',
  'پیشرفت واقعی از درس‌های کوچک و استمرار روزانه ساخته می‌شود.':'Real progress comes from small lessons and daily consistency.',
  'مسیرت تا پایان':'Your journey to the end of', 'زمان باقی‌مانده مهم است؛ پیشرفت واقعی مهم‌تر.':'Time matters, but real progress matters more.',
  'روز سپری‌شده':'days elapsed', 'روز از برنامه مانده':'days remaining', 'روز مانده':'days left', 'باقی‌مانده کل منابع':'Lessons remaining', 'از':'of',
  'روزهای کامل مطالعه':'Fully completed study days', 'روز کامل':'complete days', 'روزهای دارای فعالیت':'Days with activity', 'روز فعال':'active days',
  'برنامه امروز':"Today's plan", 'روز استراحت':'Rest day', 'امروز کامل شد ✓':'Today completed ✓', 'درس':'lessons',
  'برای کامل‌شدن امروز، باید تمام اهداف برنامه‌ریزی‌شده همین روز ثبت شوند.':'Complete every scheduled goal to mark today as fully completed.',
  'هدف امروز انجام شد':"Today's goal completed", 'پایان مجموعه':'Collection finished', 'هدف امروز انجام شده':"Today's goal completed", 'ثبت':'Complete',
  'امروز درس اجباری نداری. می‌توانی مرور یا استراحت کنی.':'No required lessons today. Review or take a rest.',
  'درس‌های اضافه هم قابل ثبت هستند، اما هدف روز را تغییر نمی‌دهند.':'You can log extra lessons, but they do not change today’s targets.',
  'مشاهده همه درس‌ها':'View all lessons', 'پیشرفت کلی':'Overall progress', 'تکمیل کل منابع':'All resources completed',
  'انجام‌شده':'Completed', 'باقی‌مانده':'Remaining', 'پیشرفت مجموعه‌ها':'Progress by resource', 'همه منابع':'All resources',
  'ریتم مطالعه':'Study rhythm', 'تحلیل بیشتر':'More insights', 'فعالیت جزئی':'Partial activity',
  'درس‌های قبل از نصب برنامه جزو تاریخچه روزانه نیستند.':'Lessons completed before tracking began are excluded from daily history.',
  'روی هر درس ضربه بزن تا انجام‌شدن آن ثبت یا اصلاح شود. تمام محاسبات بلافاصله تغییر می‌کنند.':'Tap any lesson to mark it complete or undo it. All statistics update immediately.',
  'کل موارد':'Total items', 'تکمیل‌شده':'completed', '% پیشرفت':'% progress', 'هر کارت = یک درس/یونیت/چپتر قابل ثبت':'Each tile represents one lesson, unit, or chapter',
  'انجام':'Complete', 'برداشتن تیک':'Unmark', 'ثبت انجام':'Mark complete',
  'تیک‌های اولیه (مثلاً Basic Grammar ۱ تا ۹) به عنوان پیشرفت قبلی ذخیره شده‌اند و به اشتباه به فعالیت امروز اضافه نمی‌شوند.':'Your initial completed lessons (e.g. Basic Grammar 1–9) are saved as baseline progress and do not count toward today’s activity.',
  'روز کامل یعنی همه اهداف تعیین‌شده همان روز انجام شده باشند، نه صرفاً مطالعه یکی دو منبع.':'A complete day means finishing all scheduled targets, not just working on one or two resources.',
  'ماه قبل':'Previous month', 'امروز':'Today', 'ماه بعد':'Next month',
  'ش':'S', 'ی':'S', 'د':'M', 'س':'T', 'چ':'W', 'پ':'T', 'ج':'F',
  'کامل':'Complete', 'جزئی':'Partial', 'بدون برنامه':'Not scheduled',
  'روز آزاد / استراحت':'Free / rest day', 'تمام اهداف این روز انجام شده‌اند':'All targets for this day were completed',
  'مطالعه انجام شده؛ همه اهداف کامل نیستند':'Some studying completed; targets are not all met', 'روز پیش رو':'Upcoming day', 'اهداف این روز کامل نشده‌اند':'Targets for this day are not complete',
  'درس ثبت‌شده در این روز':'Lessons logged on this day', 'برای این روز طبق تنظیمات هدف الزامی وجود ندارد.':'No mandatory targets are scheduled for this day.',
  'تعداد درس‌ها عملکرد اجرایی را نشان می‌دهد؛ ارزیابی مهارت‌ها را جداگانه ثبت کن تا این دو با هم اشتباه نشوند.':'Lesson counts track work completed. Record your skill assessments separately to avoid confusing activity with proficiency.',
  'روزهای کامل':'Complete days', 'روزهای مطالعه':'Study days', 'درس‌های ۱۴ روز اخیر':'Lessons in the last 14 days',
  'سرعت فعلی و پیش‌بینی پایان':'Current pace & finish forecast', 'مجموعه':'Resource', 'سرعت واقعی / هفته':'Actual pace / week', 'تخمین زمان پایان':'Estimated time to finish',
  'هنوز داده کافی نیست':'Not enough data yet', 'به پایان رسیده':'Completed', 'هدف هفتگی خاموش':'Weekly target disabled', 'هفته ·':'weeks ·',
  'برنامه فعلی':'planned pace', 'سرعت اخیر':'recent pace',
  'تخمین‌ها تقریبی‌اند. برای گرامر، با عبور از Basic سرعت هدف به یک یونیت در روز تغییر می‌کند؛ اعداد روزهای مطالعه لزوماً با روزهای تقویمی یکی نیستند.':'Forecasts are estimates. Grammar switches to your Intermediate daily goal after Basic is complete; study days are not the same as calendar days.',
  'فعالیت ۱۴ روز اخیر':'Activity over the last 14 days', 'ارزیابی شخصی ۴ مهارت':'Self-assessment of 4 skills',
  'امتیاز ۱ تا ۵ صرفاً احساس فعلی تو درباره مهارت‌هاست، نه آزمون استاندارد CEFR یا نمره IELTS.':'Scores from 1–5 reflect your own assessment, not a standardized CEFR level or IELTS band.',
  '/۵':'/5', 'این هفته کجا پیشرفت داشتم؟ چه چیزی دشوار بود؟':'Where did I improve this week? What was challenging?',
  'ارزیابی این هفته ثبت شد.':'Assessment saved.', 'ثبت ارزیابی امروز':"Save today's assessment", 'ارزیابی ثبت شده. ثبت مجدد در یک روز، ارزیابی همان روز را به‌روزرسانی می‌کند.':'assessments saved. Submitting again on the same day updates that day’s entry.',
  'آخرین ارزیابی‌ها':'Recent assessments', 'تنظیمات و امنیت داده‌ها':'Settings & data protection',
  'همه تغییرات به‌صورت محلی ذخیره می‌شوند. برای محافظت در برابر حذف مرورگر، نسخه مستقل JSON تهیه کن.':'All changes are saved locally. Export a separate JSON backup to protect against browser data loss.',
  'مهلت و ظاهر برنامه':'Deadline & appearance', 'شروع برنامه':'Program start', 'پایان Pre-IELTS':'Pre-IELTS deadline',
  '۱۴۵ روز از شروع':'145 days from start', '۱۵۰ روز از شروع':'150 days from start', 'پوسته برنامه':'Theme', 'تیره':'Dark', 'روشن':'Light',
  'پشتیبان‌گیری و بازیابی':'Backup & restore', 'ذخیره خودکار روشن است':'Autosave is on',
  'پس از هر تغییر، داده‌ها به IndexedDB می‌روند. نسخه‌های بازیابی داخل همین مرورگر هم نگهداری می‌شوند، نه در یک محل مستقل.':'Every change is saved to IndexedDB. Recovery points stay in this same browser, not in an independent location.',
  'دانلود فایل Backup':'Download backup file', 'بازیابی از فایل':'Import backup',
  'درخواست فضای ذخیره پایدار پذیرفته شد.':'Persistent storage was granted.', 'مرورگر فضای ذخیره پایدار را تأیید نکرد.':'The browser did not grant persistent storage.',
  'درخواست محافظت بیشتر از فضای ذخیره':'Request persistent storage', 'آخرین خروجی خارجی:':'Last external backup:', 'هنوز تهیه نشده':'Not created yet',
  '· فایل خارجی را روی حافظه دیگری هم نگه دار.':'· Keep another copy of your backup on a separate device or drive.',
  'اهداف روزانه و هفتگی':'Daily & weekly targets',
  'هر روز فقط وقتی کامل است که تمام دسته‌های فعال و برنامه‌ریزی‌شده در آن روز به هدف خود برسند. روز یکشنبه پیش‌فرض استراحت است.':'A day is complete only when every scheduled active resource meets its goal. Sunday is the default rest day.',
  'Basic: هدف روزانه جدا · Intermediate: هدف روزانه جدا':'Separate targets for Basic and Intermediate',
  'تعداد درس در روزهای انتخاب‌شده':'Lessons per selected study day', 'هدف':'Target', 'فعال':'Enabled',
  'نسخه‌های بازیابی خودکار':'Automatic recovery points', 'تازه‌سازی':'Refresh',
  'یک نسخه به‌روزشونده برای هر روز و نسخه‌هایی از هر ۱۵ تغییر ذخیره می‌شود. این‌ها در همان مرورگر هستند و جای فایل Backup را نمی‌گیرند.':'A rolling daily recovery point and snapshots every 15 changes are kept in this browser. These are not a substitute for exported backups.',
  'بازیابی':'Restore', 'هنوز نسخه بازیابی موجود نیست.':'No recovery points available yet.',
  'این نسخه بدون حساب کاربری و بدون همگام‌سازی بین دستگاه‌هاست. برای انتقال داده از Export/Import استفاده کن. به‌روزرسانی کد باید ساختار داده را حفظ کند؛ در آینده می‌توانیم مهاجرت نسخه‌های دیتابیس را به برنامه اضافه کنیم.':'This version has no account or device sync. Transfer your progress with Export/Import. Future code updates should preserve the data format; database migrations can be added later.',
  'بستن':'Close',
  'مکالمه، واژگان و دانش عمومی زبان':'Conversation, vocabulary & general English',
  'آخرین نسخه امروز':"Today's latest version",'پیش از بازیابی':'Before restoring','بازیابی دوره‌ای':'Periodic recovery point',
  'مرورگر از IndexedDB پشتیبانی نمی‌کند.':'This browser does not support IndexedDB.',
  'لطفاً تب‌های دیگر برنامه را ببند و دوباره امتحان کن.':'Close other tabs of this app and try again.',
  'نسخه انتخاب‌شده پیدا نشد.':'The selected recovery point could not be found.',
  'ساختار فایل معتبر نیست.':'Invalid file structure.', 'نسخه پشتیبان پشتیبانی نمی‌شود.':'Unsupported backup version.',
  'تاریخ‌های فایل نامعتبر است.':'Invalid dates in the backup.', 'برنامه روزانه نامعتبر است.':'Invalid daily plan in the backup.',
  'وضعیت درس نامعتبر:':'Invalid lesson record:', 'سرعت گرامر نامعتبر است.':'Invalid grammar pace.'
}

export function translate(fa: string, lang: Language): string {
  if (lang === 'fa') return fa
  if (EN[fa]) return EN[fa]
  // Error messages may contain a task ID after a translated prefix.
  for (const prefix of ['وضعیت درس نامعتبر:']) {
    if (fa.startsWith(prefix)) return `${EN[prefix]}${fa.slice(prefix.length)}`
  }
  return fa
}

export function formatNumber(value: number, lang: Language): string {
  return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(value)
}

/** Short date: Persian (Solar Hijri) in FA; Gregorian in EN. */
export function formatDate(value: string, lang: Language, options: Intl.DateTimeFormatOptions = {day:'numeric', month:'short', year:'numeric'}): string {
  const date = new Date(`${value}T12:00:00`)
  return date.toLocaleDateString(lang === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US-u-ca-gregory', options)
}

/** The study calendar grid uses Gregorian months regardless of UI language. */
export function formatCalendarMonth(ym: string, lang: Language): string {
  return new Date(`${ym}-15T12:00:00`).toLocaleDateString(lang === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory', { year: 'numeric', month: 'long' })
}

export function formatTimestamp(value: string, lang: Language, timeOnly = false): string {
  const date = new Date(value)
  const locale = lang === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US-u-ca-gregory'
  return timeOnly ? date.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'}) : date.toLocaleString(locale)
}

export const WEEK_DAYS: Record<Language,string[]> = {
  fa: ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],
  en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
}
export const WEEK_SHORT: Record<Language,string[]> = {
  fa: ['ش','ی','د','س','چ','پ','ج'], // Saturday -> Friday
  en: ['S','M','T','W','T','F','S'] // Sunday -> Saturday
}
