# Lab 3: staff login and logout. Accounts come from Password.txt.
class SessionsController < ApplicationController
  MAX_ATTEMPTS = 3
  LOCK_TIME = 60.seconds

  before_action :skip_if_logged_in, only: %i[new create]

  # GET /login
  def new
  end

  # POST /login
  def create
    if locked?
      flash.now[:alert] = "Too many wrong attempts. Please wait #{seconds_until_unlocked} seconds and try again."
      return render :new, status: :too_many_requests
    end

    username = params[:username].to_s.strip
    password = params[:password].to_s

    if username.empty? || password.empty?
      flash.now[:alert] = "Enter both your username and password."
      return render :new, status: :unprocessable_entity
    end

    account = PasswordFile.new.authenticate(username, password)

    if account
      log_in(account)
    else
      record_failed_attempt
      render :new, status: :unprocessable_entity
    end
  rescue PasswordFile::MissingFile => error
    logger.error(error.message)
    flash.now[:alert] = "Login is not available right now because Password.txt is missing."
    render :new, status: :unprocessable_entity
  end

  # DELETE /logout
  def destroy
    name = current_staff&.name
    reset_session
    message = name ? "Goodbye, #{name}. You have logged out." : "You have logged out."
    redirect_to root_path, notice: message, status: :see_other
  end

  private

  def log_in(account)
    return_to = session[:return_to] || admin_feedback_path
    reset_session # a new session id after login
    session[:staff_username] = account.username
    session[:logged_in_at] = Time.current.iso8601
    redirect_to return_to, notice: "Welcome back, #{account.name}."
  end

  def record_failed_attempt
    attempts = session[:failed_attempts].to_i + 1
    attempts_left = MAX_ATTEMPTS - attempts

    if attempts_left.positive?
      session[:failed_attempts] = attempts
      flash.now[:alert] = "Wrong username or password. #{attempts_left} #{"attempt".pluralize(attempts_left)} left."
    else
      session[:failed_attempts] = 0
      session[:locked_until] = (Time.current + LOCK_TIME).iso8601
      flash.now[:alert] = "Wrong username or password. Login is locked for #{LOCK_TIME.to_i} seconds."
    end
  end

  def locked?
    seconds_until_unlocked.positive?
  end

  def seconds_until_unlocked
    locked_until = Time.zone.parse(session[:locked_until].to_s)
    return 0 if locked_until.nil?

    [ (locked_until - Time.current).ceil, 0 ].max
  end

  def skip_if_logged_in
    redirect_to admin_feedback_path if logged_in?
  end
end
