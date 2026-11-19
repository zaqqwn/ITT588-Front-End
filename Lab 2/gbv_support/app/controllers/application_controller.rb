class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Lab 3: views can also call these, e.g. to show "Staff login" or "Log out" in the navbar.
  helper_method :current_staff, :logged_in?

  private

  # The logged-in account from Password.txt, or nil for visitors.
  def current_staff
    return @current_staff if defined?(@current_staff)

    username = session[:staff_username]
    @current_staff = username && PasswordFile.new.find(username)
  rescue PasswordFile::MissingFile
    @current_staff = nil
  end

  def logged_in?
    !current_staff.nil?
  end

  # Used with before_action to protect staff-only pages.
  def require_login
    return if logged_in?

    session[:return_to] = request.fullpath
    redirect_to login_path, alert: "Please log in to see the staff inbox."
  end
end
