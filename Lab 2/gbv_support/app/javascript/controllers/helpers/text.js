// Lab 3: small helpers shared by the Stimulus controllers.

export const TIME_ZONE = "Asia/Kuala_Lumpur"
const ONE_DAY = 24 * 60 * 60 * 1000

// Turns < > & " ' into safe text before it is put into the page with innerHTML,
// so nobody can inject HTML or a <script> through the form.
export function escapeHtml(value) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
  return String(value).replace(/[&<>"']/g, (character) => map[character])
}

// "Saturday, 25 October 2026 at 8:45 pm" in Malaysia time.
export function formatDateTime(date) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: TIME_ZONE, dateStyle: "full", timeStyle: "short"
  }).format(date)
}

// "Thursday, 30 October 2026" for a date picked in the form.
export function formatDay(date) {
  return date.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

// Whole days between today and another date (both at midnight).
export function daysFromToday(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const other = new Date(date)
  other.setHours(0, 0, 0, 0)
  return Math.round((other - today) / ONE_DAY)
}

// "just now", "5 minutes ago", "2 hours ago", "3 days ago"
export function timeAgo(date, now = new Date()) {
  const seconds = Math.round((now - date) / 1000)
  if (seconds < 45) return "just now"

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`

  const days = Math.round(hours / 24)
  return days < 7 ? `${days} ${days === 1 ? "day" : "days"} ago` : formatDay(date)
}
