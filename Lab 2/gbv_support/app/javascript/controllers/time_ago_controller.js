import { Controller } from "@hotwired/stimulus"
import { timeAgo } from "controllers/helpers/text"

// Lab 3: shows "5 minutes ago" for each message in the staff inbox
// and refreshes the text every 30 seconds with setInterval().
export default class extends Controller {
  static targets = ["time"]

  connect() {
    this.refresh()
    this.timer = setInterval(() => this.refresh(), 30000)
  }

  disconnect() {
    clearInterval(this.timer) // stop the timer when the user leaves the page
  }

  refresh() {
    const now = new Date()
    for (const element of this.timeTargets) {
      element.textContent = timeAgo(new Date(element.getAttribute("datetime")), now)
    }
    console.log(`[time-ago] ${this.timeTargets.length} times updated at ${now.toLocaleTimeString("en-MY")}`)
  }
}
