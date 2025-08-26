# app/controllers/api/social_media_posts_controller.rb
class Api::SocialMediaPostsController < ApplicationController
  before_action :require_login
  SUPPORTED_PLATFORMS = %w[instagram facebook] # Add more as needed

  def index
    platform = extract_platform_from_path(request.path)
    unless SUPPORTED_PLATFORMS.include?(platform)
      return render json: { error: 'Unsupported social media platform' }, status: 400
    end

    controller_class = SocialMediaPostFactory.for_url(request.path)
    if controller_class.respond_to?(:handle_request)
      result = controller_class.handle_request(params)
      render json: result
    else
      render json: { error: 'Platform controller does not implement handle_request' }, status: 500
    end
  rescue => e
    render json: { error: e.message }, status: 422
  end

  private

  def extract_platform_from_path(path)
    # expects /api/social_media/:platform
    path.split('/').last
  end
end
