class SessionsController < ApplicationController
  def new
    redirect_to dashboard_path if logged_in?
  end

  def create
    user = CredentialStore.authenticate(
      username: params[:username],
      password: params[:password]
    )

    if user
      reset_session
      session[:user] = user
      redirect_to dashboard_path, notice: "Login successful! Welcome, #{user[:username]}."
    else
      flash.now[:alert] = "Invalid username or password."
      render :new, status: :unprocessable_entity
    end
  rescue CredentialStore::CredentialFileError => e
    Rails.logger.error(e.message)
    flash.now[:alert] = "The credential file could not be read. Please contact the administrator."
    render :new, status: :service_unavailable
  end

  def destroy
    reset_session
    redirect_to login_path, notice: "You have logged out."
  end
end
