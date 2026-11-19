# SafeSpace Malaysia - ITT588 Lab Work 03

Lab 3 adds JavaScript (Stimulus, the JavaScript framework that comes with Rails), a staff login that reads `Password.txt`, and a staff inbox that reads saved feedback from a text file.

## Run it

Double-click `start_server.bat`, or open PowerShell in this folder and run:

    ruby bin/rails server

Then open http://localhost:3000. Run the tests with `run_tests.bat` (results go to `tmp\test_results.txt`) or `ruby bin/rails test`.

## Staff accounts (from Password.txt)

| Username  | Password       | Role      |
|-----------|----------------|-----------|
| admin     | SafeSpace@2026 | admin     |
| volunteer | Kasih#15999    | volunteer |

## What was added

| Requirement | Where |
|---|---|
| HTML form | Contact page feedback form (`app/views/pages/contact.html.erb`), checked by `feedback_form_controller.js` |
| Popup dialog | `<dialog>` review popup opened with `showModal()` |
| innerHTML | Error list, character counter, reply-date hint, review popup, quiz marks and score |
| document.write() | Printable Myth or Fact summary in a new tab (`myth_quiz_controller.js`) |
| window.alert() | Thank-you alert after confirming feedback; alert for unanswered quiz questions |
| console | `console.log / info / warn / table / group` in every controller |
| Operators and control statements | if / else if, switch, ternary, for...of, `===`, `&&`, `||`, `!`, `+=`, `%` |
| Event loop | `setTimeout` + `Promise` order when sending feedback; `setInterval` in the inbox |
| Date and time | Reply-date rules (tomorrow to 30 days, weekdays only), Malaysia time on the quiz summary, "5 minutes ago" in the inbox |
| Login with Password.txt | `PasswordFile` model, `SessionsController`, 3-attempt lockout, logout |
| File handling | `FeedbackStore` saves to and reads from `storage/feedback.txt` |
