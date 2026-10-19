/**
 * =============================================
 * @gamo/content — Lesson Storage & Preset Manager
 * =============================================
 * Quản lý kho bài học cục bộ (LocalStorage) của Giáo viên.
 * Lưu 1 lần, mở bất kỳ game nào cũng lấy được.
 */

import { CURRICULUM_LIBRARY } from './curriculum.js';
import { createLessonPack } from './schema.js';

const STORAGE_KEY_LESSONS = 'gamo_teacher_lessons';
const STORAGE_KEY_ACTIVE  = 'gamo_active_lesson';

/**
 * Gets all saved lessons. Falls back to curriculum library if empty.
 * @returns {Array<Object>} List of lesson packs
 */
export function getAllLessons() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LESSONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read lessons from localStorage', e);
  }

  // First time: initialize with pre-built curriculum library
  saveLessons(CURRICULUM_LIBRARY);
  return CURRICULUM_LIBRARY;
}

/**
 * Saves a list of lesson packs.
 */
export function saveLessons(lessons) {
  try {
    localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(lessons));
  } catch (e) {
    console.error('Failed to save lessons to localStorage', e);
  }
}

/**
 * Saves or updates a single lesson pack.
 */
export function saveLessonPack(pack) {
  const lessons = getAllLessons();
  const existingIdx = lessons.findIndex(l => l.id === pack.id);

  if (existingIdx >= 0) {
    lessons[existingIdx] = { ...pack, updatedAt: new Date().toISOString() };
  } else {
    lessons.unshift(pack);
  }

  saveLessons(lessons);
  // Also set as current active lesson
  setActiveLesson(pack);
  return pack;
}

/**
 * Deletes a lesson pack by ID.
 */
export function deleteLesson(id) {
  const lessons = getAllLessons().filter(l => l.id !== id);
  saveLessons(lessons);

  // If deleted pack was active, reset active to first available
  const active = getActiveLesson();
  if (active && active.id === id) {
    setActiveLesson(lessons[0] || null);
  }
  return lessons;
}

/**
 * Sets the active lesson pack (used across all games).
 */
export function setActiveLesson(pack) {
  try {
    if (pack) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(pack));
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  } catch (e) {
    console.warn('Failed to set active lesson', e);
  }
}

/**
 * Gets the current active lesson pack.
 * If none is set, defaults to the first available lesson.
 */
export function getActiveLesson() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to get active lesson', e);
  }

  const all = getAllLessons();
  const first = all[0] || null;
  if (first) setActiveLesson(first);
  return first;
}

/**
 * Exports all lessons to downloadable JSON.
 */
export function exportLessonsToJSON() {
  const lessons = getAllLessons();
  return JSON.stringify(lessons, null, 2);
}

/**
 * Imports lessons from a JSON string.
 */
export function importLessonsFromJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) throw new Error('File JSON không đúng định dạng mảng bài học');

    const normalized = parsed.map(p => createLessonPack(p));
    const current = getAllLessons();
    const merged = [...normalized, ...current.filter(c => !normalized.some(n => n.id === c.id))];
    saveLessons(merged);
    return { success: true, count: normalized.length };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
