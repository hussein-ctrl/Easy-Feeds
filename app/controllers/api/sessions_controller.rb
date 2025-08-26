class Api::SessionsController < ApplicationController
  def create
    Rails.logger.info "Session create attempt for email: #{params[:user][:email]}"
    @user = User.find_by_credentials(params[:user][:email], params[:user][:password])
    if @user
      Rails.logger.info "Session created for user: #{@user.id}"
      login(@user)
      render "/api/users/show"
    else
      Rails.logger.warn "Session creation failed for email: #{params[:user][:email]}"
      render json: ["Email/password combination is invalid"], status: 422
    end
  end

  def destroy
    Rails.logger.info "Session destroy attempt for user: #{current_user&.id}"
    @user = current_user
    if @user
      logout!
      Rails.logger.info "Session destroyed for user: #{@user.id}"
      render json: "{}", status: 200
    else
      Rails.logger.warn "Session destroy failed: No user logged in"
      render json: ["No user logged in"], status: 404
    end
  end
end
