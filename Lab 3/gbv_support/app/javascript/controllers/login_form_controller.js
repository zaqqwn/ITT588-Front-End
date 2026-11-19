import { Controller } from "@hotwired/stimulus"

// Lab 3: login page helpers. Warns the user when Caps Lock is on,
// because passwords in Password.txt are case-sensitive.
export default class extends Controller {
  static targets = ["warning", "button"]

  check(event) {
    if (typeof event.getModifierState !== "function") return

    const capsOn = event.getModifierState("CapsLock")
    if (this.warningTarget.hidden === capsOn) {
      console.info(`[login-form] Caps Lock is ${capsOn ? "on" : "off"}`)
    }
    this.warningTarget.hidden = !capsOn
  }

  // Stops double clicks while the server checks Password.txt
  submitting() {
    this.buttonTarget.value = "Checking..."
    console.log(`[login-form] login sent at ${new Date().toLocaleTimeString("en-MY")}`)
  }
}
