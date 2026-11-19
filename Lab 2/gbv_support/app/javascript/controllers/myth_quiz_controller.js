import { Controller } from "@hotwired/stimulus"
import { escapeHtml, formatDateTime } from "controllers/helpers/text"

const PASS_MARK = 70 // percent

// Lab 3: Myth or Fact quiz on the What Is GBV page.
export default class extends Controller {
  static targets = ["form", "question", "feedback", "result"]

  connect() {
    this.lastResult = null
    console.info(`[myth-quiz] ${this.questionTargets.length} questions loaded`)
  }

  check(event) {
    event.preventDefault()
    const answers = this.collectAnswers()
    const missing = answers.filter((item) => item.choice === null).map((item) => item.number)

    // Output 3: window.alert() when some questions are not answered
    if (missing.length > 0) {
      console.warn("[myth-quiz] unanswered questions:", missing)
      window.alert(`Please answer question ${missing.join(", ")} before checking your score.`)
      this.questionTargets[missing[0] - 1].querySelector("input").focus()
      return
    }

    // Event loop: show "Checking..." first, then mark the answers in a later task
    this.resultTarget.hidden = false
    this.resultTarget.innerHTML = '<p class="quiz-checking"><span class="spinner" aria-hidden="true"></span> Checking your answers...</p>'
    setTimeout(() => this.showScore(answers), 400)
  }

  collectAnswers() {
    return this.questionTargets.map((question, index) => {
      const picked = question.querySelector("input:checked")
      return {
        number: index + 1,
        statement: question.dataset.statement,
        choice: picked ? picked.value : null,
        answer: question.dataset.answer,
        why: question.dataset.why
      }
    })
  }

  // Output 1: innerHTML for the feedback under each question and the score box
  showScore(answers) {
    let score = 0

    for (const item of answers) {
      item.correct = item.choice === item.answer
      if (item.correct) score += 1

      const question = this.questionTargets[item.number - 1]
      question.classList.toggle("is-correct", item.correct)
      question.classList.toggle("is-wrong", !item.correct)
      this.feedbackTargets[item.number - 1].innerHTML =
        `<strong>${item.correct ? "Correct" : "Not quite"}:</strong> this is a ${item.answer}. ${escapeHtml(item.why)}`
    }

    const total = answers.length
    const percent = Math.round((score / total) * 100)
    const level = this.levelFor(percent)
    this.lastResult = { score, total, percent, level, answers, checkedAt: new Date() }

    this.resultTarget.className = `quiz-result quiz-result--${level.tone}`
    this.resultTarget.innerHTML = `
      <div class="quiz-result__score"><strong>${score}/${total}</strong><span>${percent}%</span></div>
      <div>
        <h3>${level.title}</h3>
        <p>${level.message}</p>
        <button type="button" class="button button--primary" data-action="myth-quiz#openSummary">Open printable summary</button>
      </div>`

    // Output 4: console
    console.log(`[myth-quiz] score ${score}/${total} (${percent}%): ${level.title}`)
    console.table(answers.map(({ number, choice, answer, correct }) => ({ number, choice, answer, correct })))
  }

  levelFor(percent) {
    switch (true) {
      case percent === 100:
        return { tone: "great", title: "Excellent!", message: "You can tell myths from facts. Share what you know with others." }
      case percent >= PASS_MARK:
        return { tone: "good", title: "Well done", message: "You know most of the facts. Read the notes above for the ones you missed." }
      default:
        return { tone: "low", title: "Keep learning", message: "Some myths are very common. Read the notes above, then try again." }
    }
  }

  // Output 2: document.write() builds a whole new page in a new tab.
  // public/summary.html is an empty page on this site; once it loads we write the result into it.
  openSummary() {
    if (!this.lastResult) return

    const summary = window.open("/summary.html", "_blank")
    if (!summary) {
      console.warn("[myth-quiz] the browser blocked the new tab")
      window.alert("Your browser blocked the summary. Please allow pop-ups for this site and try again.")
      return
    }
    summary.addEventListener("load", () => this.writeSummary(summary.document, this.lastResult))
  }

  writeSummary(doc, result) {
    doc.open()
    doc.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
      <title>My Myth or Fact result | SafeSpace Malaysia</title>
      <style>
        body { max-width: 760px; margin: 40px auto; padding: 0 20px; color: #222036; font-family: system-ui, sans-serif; line-height: 1.5; }
        h1 { margin-bottom: 4px; color: #4c2f82; }
        .meta { color: #666278; }
        .score { padding: 16px 20px; font-size: 1.3rem; background: #eee8f8; border-radius: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e6e1ed; vertical-align: top; }
        th { background: #f6f2fb; }
        .yes { color: #17714a; font-weight: 700; }
        .no { color: #a6283c; font-weight: 700; }
        .help { padding: 14px 18px; background: #fff2f3; border-radius: 10px; }
        button { padding: 10px 18px; color: #fff; background: #6845a6; border: 0; border-radius: 8px; font: inherit; cursor: pointer; }
        @media print { button { display: none; } }
      </style></head><body>`)
    doc.write("<h1>Myth or fact? My result</h1>")
    doc.write(`<p class="meta">SafeSpace Malaysia &middot; checked on ${formatDateTime(result.checkedAt)} (Malaysia time)</p>`)
    doc.write(`<p class="score"><strong>${result.score} out of ${result.total}</strong> correct (${result.percent}%) &middot; ${result.level.title}</p>`)
    doc.write("<table><thead><tr><th>#</th><th>Statement</th><th>My answer</th><th>Answer</th><th>Result</th></tr></thead><tbody>")
    for (const item of result.answers) {
      doc.write(`<tr><td>${item.number}</td><td>${escapeHtml(item.statement)}</td><td>${item.choice}</td>` +
                `<td>${item.answer}</td><td class="${item.correct ? "yes" : "no"}">${item.correct ? "Correct" : "Wrong"}</td></tr>`)
    }
    doc.write("</tbody></table>")
    doc.write('<p class="help"><strong>Need to talk to someone?</strong> Talian Kasih 15999 (24 hours) &middot; Emergency 999</p>')
    doc.write('<button type="button" onclick="window.print()">Print this page</button>')
    doc.write("</body></html>")
    doc.close()

    console.info("[myth-quiz] summary page written with document.write()")
  }

  reset() {
    this.formTarget.reset()
    this.lastResult = null
    this.questionTargets.forEach((question) => question.classList.remove("is-correct", "is-wrong"))
    this.feedbackTargets.forEach((feedback) => { feedback.innerHTML = "" })
    this.resultTarget.hidden = true
    this.resultTarget.innerHTML = ""
    console.info("[myth-quiz] quiz reset")
  }
}
