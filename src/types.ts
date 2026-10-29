export type CategoryId = 'aef' | 'listening' | 'grammar' | 'reading' | 'writing' | 'busuu'
export interface Book { id: string; category: CategoryId; title: string; subtitle: string; units: number; lessonsPerUnit?: string[]; color: string }
export interface Task { id: string; bookId: string; category: CategoryId; ordinal: number; unit: number; lesson?: string; label: string }
export interface Completion { at: string; seeded?: boolean }
export interface Plan { enabled: boolean; days: number[]; perDay: number }
export interface Reflection { date: string; listening: number; reading: number; writing: number; speaking: number; note: string }
export interface Activity { at: string; action: 'complete'|'undo'; taskId: string }
export interface Settings { language?: 'fa'|'en'; startDate: string; deadline: string; plans: Record<CategoryId, Plan>; basicPerDay: number; intermediatePerDay: number; theme: 'dark'|'light'; lastExportAt?: string }
export interface AppState { schema: 1; revision: number; records: Record<string, Completion>; activity: Activity[]; reflections: Reflection[]; settings: Settings }
export interface Archive { id: string; at: string; reason: string; state: AppState }
