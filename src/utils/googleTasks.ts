/**
 * Google Tasks Integration Utility
 * Enables authors to convert philosophical realizations into actionable Google Tasks.
 */

export function openGoogleTasks(title: string, note?: string): void {
  // Pre-copy actionable item to clipboard for immediate 1-click paste
  const taskText = `${title}${note ? `\n\nNotes from MindScribe:\n${note}` : ''}`;
  try {
    navigator.clipboard?.writeText(taskText);
  } catch (e) {
    // ignore
  }

  // Open Google Tasks in a focused popup or new tab
  const tasksUrl = 'https://tasks.google.com/';
  window.open(tasksUrl, '_blank', 'noopener,noreferrer');
}
