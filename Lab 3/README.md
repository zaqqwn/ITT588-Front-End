# Lab Work 03 — SafeSpace Malaysia: JavaScript, login & file handling

**ITT588 Front-End Technology** · Muhammad Zaqwan bin Mohamad Hussen · 2025140555 · CDCS2666B

Lab 3 builds on the [Lab 2](../Lab%202/) SafeSpace Malaysia website. It adds JavaScript (Stimulus controllers), a staff login that reads `Password.txt`, and a staff inbox that reads saved feedback from a text file.

- 📁 **Project:** [`gbv_support/`](gbv_support/)
- 📄 **Lab 3 document:** [Lab 3.pdf](Lab%203.pdf)
- 📝 **Lab 3 notes (requirement → where it is done):** [`gbv_support/LAB03_README.md`](gbv_support/LAB03_README.md)

## What Lab 3 adds
| Requirement | Where |
|---|---|
| HTML form + popup dialog | Contact page feedback form, `<dialog>` review popup (`feedback_form_controller.js`) |
| `innerHTML`, `document.write()`, `window.alert()`, `console` | Error list, character counter, quiz score, printable Myth-or-Fact summary, thank-you alert |
| Operators, control statements, event loop | `if/else`, `switch`, ternary, `for…of`; `setTimeout`, `Promise`, `setInterval` |
| Date and time | Reply-date rules (weekdays, 1–30 days ahead), Malaysia time, "5 minutes ago" in the inbox |
| Login with `Password.txt` | `PasswordFile` model, `SessionsController`, 3-attempt lockout, logout |
| File handling | `FeedbackStore` saves to and reads from `storage/feedback.txt` |

## Run it
Double-click `gbv_support/start_server.bat`, or:
```powershell
cd gbv_support
bundle install
ruby bin/rails server
```
Open <http://localhost:3000>. Staff accounts are listed in `gbv_support/Password.txt` (demo passwords for this lab only).
