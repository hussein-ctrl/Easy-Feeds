class Api::UsersController < ApplicationController
  # Log user creation attempts and results
  def create
    Rails.logger.info "Attempting to create user with params: #{params[:user].inspect}"
    @user = User.new(user_params)

    if @user.save
      Rails.logger.info "User created successfully: #{@user.inspect}"
      login(@user)
      render :show
    else
      Rails.logger.error "User creation failed: #{@user.errors.full_messages.inspect}"
      render json: @user.errors.full_messages, status: 422
    end
  end

  def user_params
    params.require(:user).permit(:email, :first_name, :last_name, :password)
  end
end
