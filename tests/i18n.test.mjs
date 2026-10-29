import test from 'node:test'
import assert from 'node:assert/strict'
import { initialState, TASKS, TASKS_BY_BOOK } from '../src/catalog.ts'
import { complete, readBackup, totalStats, targetOnDay } from '../src/engine.ts'
import { formatDate, formatCalendarMonth, formatNumber, translate, WEEK_SHORT } from '../src/i18n.ts'

test('Persian and English translations and number formatting', () => {
  assert.equal(translate('داشبورد','fa'), 'داشبورد')
  assert.equal(translate('داشبورد','en'), 'Dashboard')
  assert.equal(formatNumber(145,'en'), '145')
  assert.equal(formatNumber(145,'fa'), '۱۴۵')
})

test('English date is Gregorian; calendar heading matches Gregorian month grid', () => {
  assert.match(formatDate('2026-10-29','en'), /Oct/)
  assert.match(formatCalendarMonth('2026-10','en'), /October 2026/)
  assert.match(formatCalendarMonth('2026-10','fa'), /اکتبر/)
  assert.deepEqual(WEEK_SHORT.en, ['S','M','T','W','T','F','S'])
})

test('schema-1 legacy backup without language opens in Persian without losing progress', () => {
  const previous = initialState('2026-10-29')
  delete previous.settings.language
  const progressed = complete(previous, TASKS_BY_BOOK.get('aef2')[0].id, '2026-10-29T08:00:00.000Z')
  const loaded = readBackup({format:'English Mastery OS Backup',state:progressed})
  assert.equal(loaded.settings.language,'fa')
  assert.equal(totalStats(loaded).done,totalStats(progressed).done)
  assert.equal(loaded.records[TASKS_BY_BOOK.get('aef2')[0].id].at, '2026-10-29T08:00:00.000Z')
  assert.equal(TASKS.length, 652)
})

test('English language choice survives export and import without impacting plans', () => {
  const state = initialState('2026-10-29')
  state.settings.language='en'
  const loaded = readBackup(JSON.parse(JSON.stringify({state})))
  assert.equal(loaded.settings.language,'en')
  assert.deepEqual(loaded.settings.plans,state.settings.plans)
  assert.equal(targetOnDay(loaded,'grammar','2026-10-30'),2)
})
