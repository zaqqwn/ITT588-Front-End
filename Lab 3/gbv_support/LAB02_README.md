# SafeSpace Malaysia — ITT588 Lab Work 02

Completed from the existing Rails 7.2.4 project.

## Run on your computer

Open PowerShell in C:\Users\zaqwa\gbv_support and run:

    bundle install
    ruby bin/rails server

Open http://localhost:3000 in your browser. If port 3000 is busy:

    ruby bin/rails server -p 3002

Then open http://localhost:3002.

For the downloadable project, extract gbv_support and run the same commands inside that folder. The installed Ruby 3.3 runtime and existing Gemfile.lock are compatible.

## Completed features

- Home and all five required sections: What Is, Contact, Law Enforcement, Enforcer and Hotline.
- Custom responsive CSS, CSS Grid, accessible mobile menu and shared layout.
- Domestic Violence Act 1994, EPO / IPO / PO summaries and cited government guidelines.
- Agency-role table with horizontal scrolling on small screens.
- Click-to-call and WhatsApp support links, with source links.
- Feedback validation for empty fields, email format and message length.
- The feedback form only validates sample input. It does not store or deliver messages.
- Windows development asset cache fix.

## Checks

    ruby bin/rails test

Verified: 11 tests, 18 assertions, no failures or errors. Browser checks covered desktop pages, the 390px mobile menu, empty feedback and valid sample feedback.

## Presentation

ITT588_Lab02_Completed.pptx contains 19 slides. It keeps the first four slides from the original Canva draft and adds current code, website screenshots, responsive tests, validation results and references. Slide 3 correctly describes custom CSS rather than Bootstrap.

The original Canva draft has been updated with the completed 19-slide presentation and saved: https://www.canva.com/design/DAHYFKMsKpM/qU1_n73-_HRqM1aJVktvjg/edit
