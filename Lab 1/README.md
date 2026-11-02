# ITT588 Lab Work 01 — Rails Login App

This project implements the lab requirement: a Ruby on Rails login page that reads credentials from `Password.txt` instead of a database.

## Features

- Login form with username and password fields
- Credentials loaded from `Password.txt`
- User role read from the third CSV field
- Session-based login state
- Protected dashboard page
- Success and error feedback
- Logout function
- Responsive custom styling
- Automated tests for valid login, invalid login, route protection, and logout

## Run it on Windows

1. Install Ruby with Devkit from RubyInstaller. Ruby 3.3 is recommended.
2. Open **Start Command Prompt with Ruby** from the Start menu.
3. Change to this project folder.
4. Run:

   ```powershell
   gem install bundler
   bundle install
   bin/rails db:prepare
   bin/rails test
   bin/rails server
   ```

5. Open <http://localhost:3000/login>.

If Windows does not run `bin/rails` directly, use `ruby bin/rails` instead.

## Test accounts

| Username | Password | Role |
|---|---|---|
| admin | admin123 | administrator |
| user1 | user123 | user |
| sir | secret | moderator |

## Credential file format

Each non-comment line in `Password.txt` uses:

```text
username,password,role
```

This plaintext format is used only because the lab explicitly requires a text file. A real application should store password hashes in a database and use Rails authentication helpers such as `has_secure_password`.

## Suggested demonstration

1. Show the login page.
2. Enter an incorrect password and show the error message.
3. Log in with `admin` / `admin123`.
4. Show the dashboard displaying the username and role.
5. Click **Log out** and show that the dashboard is protected.
6. Briefly show `Password.txt`, `config/routes.rb`, `SessionsController`, and `CredentialStore`.
