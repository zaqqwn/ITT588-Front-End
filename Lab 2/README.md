# Lab Work 02 — SafeSpace Malaysia (GBV support website)

**ITT588 Front-End Technology** · Muhammad Zaqwan bin Mohamad Hussen · 2025140555 · CDCS2666B

A Ruby on Rails 7.2 website that gives information and support contacts for gender-based violence (GBV) in Malaysia.

- 📁 **Project:** [`gbv_support/`](gbv_support/)
- 📄 **Lab report:** [ITT588_LAB WORK 02 (PDF)](ITT588_LAB%20WORK%2002_MUHAMMAD%20ZAQWAN%20BIN%20MOHAMAD%20HUSSEN_2025140555_CDCS2666B.pdf)
- 📝 **Lab 2 notes:** [`gbv_support/LAB02_README.md`](gbv_support/LAB02_README.md)

## What Lab 2 covers
- Home page and five sections: What Is GBV, Contact, Law Enforcement, Enforcer and Hotline
- Custom responsive CSS (CSS Grid), shared layout and an accessible mobile menu
- Domestic Violence Act 1994 and EPO / IPO / PO summaries, plus an agency-role table
- Click-to-call and WhatsApp support links
- Feedback form validation (empty fields, email format, message length)

> The same `gbv_support` project was extended in [Lab 3](../Lab%203/) (JavaScript, staff login and feedback inbox), so this copy also contains the Lab 3 additions. Those are listed in `gbv_support/LAB03_README.md`.

## Run it
```powershell
cd gbv_support
bundle install
ruby bin/rails server
```
Open <http://localhost:3000>. Run the tests with `ruby bin/rails test`.
