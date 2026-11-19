import { Controller } from "@hotwired/stimulus"
import { escapeHtml, formatDay, daysFromToday } from "controllers/helpers/text"

// Lab 3: checks the Contact page feedback form in the browser.
// Flow: Review my feedback -> validate() -> popup dialog -> Confirm and send -> Rails saves it.
export default class extends Controller {
  static targets = ["form", "name", "email", "topic", "replyDate", "dateHint",
                    "message", "counter", "consent", "summary", "dialog", "review", "sendButton"]
  static values = { max: { type: Number, default: 1000 } }

  connect() {
    this.confirmed = false
    this.setDateLimits()
    this.updateCounter()
    // Remove the red border from a field as soon as the user changes it
    this.element.addEventListener("input", (event) => this.unmark(event.target))
    this.element.addEventListener("change", (event) => this.unmark(event.target))
    console.info(`[feedback-form] ready at ${new Date().toLocaleTimeString("en-MY")}`)
  }

  // ---------- Date handling ----------

  // The date picker only allows tomorrow up to 30 days from today.
  setDateLimits() {
    this.replyDateTarget.min = this.toInputValue(this.addDays(new Date(), 1))
    this.replyDateTarget.max = this.toInputValue(this.addDays(new Date(), 30))
  }

  addDays(date, days) {
    const copy = new Date(date)
    copy.setDate(copy.getDate() + days)
    return copy
  }

  // Date -> "2026-10-30" (the format used by <input type="date">)
  toInputValue(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${date.getFullYear()}-${month}-${day}`
  }

  // Returns an error message, or null when the date is fine. The date is optional.
  checkReplyDate(value) {
    if (value === "") return null

    const chosen = new Date(`${value}T00:00:00`)
    if (Number.isNaN(chosen.getTime())) return "Enter a valid reply date."

    const days = daysFromToday(chosen)
    const weekday = chosen.getDay() // 0 = Sunday, 6 = Saturday
    if (days < 1) return "Choose a reply date from tomorrow onwards."
    if (days > 30) return "Choose a reply date within the next 30 days."
    if (weekday === 0 || weekday === 6) return "Choose a weekday (Monday to Friday) for the reply date."
    return null
  }

  // Runs when the user picks a date: explains it in words under the field.
  describeDate() {
    const value = this.replyDateTarget.value
    const error = this.checkReplyDate(value)

    if (value === "") {
      this.dateHintTarget.innerHTML = "Weekdays only, within the next 30 days."
    } else if (error) {
      this.dateHintTarget.innerHTML = `<span class="hint-bad">${error}</span>`
    } else {
      const chosen = new Date(`${value}T00:00:00`)
      const days = daysFromToday(chosen)
      this.dateHintTarget.innerHTML =
        `<span class="hint-good">${formatDay(chosen)} &middot; ${days} ${days === 1 ? "day" : "days"} from today</span>`
    }
  }

  // ---------- Live character counter (innerHTML) ----------

  updateCounter() {
    const used = this.messageTarget.value.length
    const left = this.maxValue - used
    const state = left < 0 ? "over" : left <= 100 ? "low" : "ok"

    this.counterTarget.dataset.state = state
    this.counterTarget.innerHTML =
      `<strong>${used}</strong> / ${this.maxValue} characters &middot; ` +
      (left >= 0 ? `${left} left` : `${Math.abs(left)} too many`)
  }

  // ---------- Form checking ----------

  submit(event) {
    if (this.confirmed) return // second time: the user already confirmed, so let the form send

    event.preventDefault()
    const errors = this.validate()

    if (errors.length > 0) {
      this.showErrors(errors)
    } else {
      this.clearErrors()
      this.openDialog()
    }
  }

  validate() {
    const name = this.nameTarget.value.trim()
    const email = this.emailTarget.value.trim()
    const message = this.messageTarget.value.trim()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    const errors = []

    if (name === "") {
      errors.push({ field: this.nameTarget, text: "Enter your name." })
    } else if (name.length < 2) {
      errors.push({ field: this.nameTarget, text: "Your name must have at least 2 letters." })
    }

    if (!emailPattern.test(email)) {
      errors.push({ field: this.emailTarget, text: "Enter a valid email address, like name@example.com." })
    }

    if (this.topicTarget.value === "") {
      errors.push({ field: this.topicTarget, text: "Choose a topic." })
    }

    const dateError = this.checkReplyDate(this.replyDateTarget.value)
    if (dateError) errors.push({ field: this.replyDateTarget, text: dateError })

    if (message.length < 10) {
      errors.push({ field: this.messageTarget, text: "Write at least 10 characters in your message." })
    } else if (message.length > this.maxValue) {
      errors.push({ field: this.messageTarget, text: `Keep the message within ${this.maxValue} characters.` })
    }

    if (!this.consentTarget.checked) {
      errors.push({ field: this.consentTarget, text: "Tick the box to confirm you used sample details only." })
    }

    return errors
  }

  // Output 1: innerHTML. Builds the error list and puts it on the page.
  showErrors(errors) {
    this.clearErrors()

    let items = ""
    for (const error of errors) {
      items += `<li>${error.text}</li>`
      error.field.setAttribute("aria-invalid", "true")
      error.field.classList.add("is-invalid")
    }

    this.summaryTarget.innerHTML =
      `<strong>Please check ${errors.length} ${errors.length === 1 ? "item" : "items"}:</strong><ul>${items}</ul>`
    this.summaryTarget.hidden = false
    errors[0].field.focus()

    console.warn(`[feedback-form] ${errors.length} problem(s) found`, errors.map((error) => error.text))
  }

  unmark(field) {
    field.classList.remove("is-invalid")
    field.removeAttribute("aria-invalid")
  }

  clearErrors() {
    this.summaryTarget.hidden = true
    this.summaryTarget.innerHTML = ""
    this.element.querySelectorAll(".is-invalid").forEach((field) => {
      field.classList.remove("is-invalid")
      field.removeAttribute("aria-invalid")
    })
  }

  // ---------- Popup dialog ----------

  openDialog() {
    const data = this.formData()
    const rows = [
      ["Name", data.name],
      ["Email", data.email],
      ["Topic", data.topic],
      ["Reply date", data.replyDate ? formatDay(new Date(`${data.replyDate}T00:00:00`)) : "No preference"],
      ["Message", data.message]
    ]

    // escapeHtml() keeps the user's text as plain text inside innerHTML
    this.reviewTarget.innerHTML = rows
      .map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value)}</dd>`)
      .join("")

    this.dialogTarget.showModal()
    console.log("[feedback-form] form is valid, showing the review dialog")
    console.table(data)
  }

  edit() {
    this.dialogTarget.close()
    this.messageTarget.focus()
  }

  // Output 3: window.alert(), then the event loop decides when the form is really sent.
  confirm() {
    const { name } = this.formData()
    const sentAt = new Date().toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })

    this.sendButtonTarget.disabled = true
    this.sendButtonTarget.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending...'

    console.group("[feedback-form] event loop while sending")
    console.log("1. confirm() runs first (normal synchronous code)")

    setTimeout(() => {
      console.log("3. setTimeout callback runs last (task queue): sending the form to Rails")
      console.groupEnd()
      this.confirmed = true
      this.formTarget.requestSubmit()
    }, 600)

    Promise.resolve().then(() => {
      console.log("2. Promise callback runs next (microtask queue)")
    })

    window.alert(`Thank you, ${name}! Your feedback is being sent at ${sentAt}.`)
  }

  formData() {
    return {
      name: this.nameTarget.value.trim(),
      email: this.emailTarget.value.trim(),
      topic: this.topicTarget.value,
      replyDate: this.replyDateTarget.value,
      message: this.messageTarget.value.trim()
    }
  }
}
