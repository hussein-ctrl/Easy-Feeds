# app/services/social_media_post_factory.rb

class SocialMediaPostFactory
  def self.for_url(url)
    case url
    when /api\/social_media\/facebook/
      Api::FacebookPostsController
    when /api\/social_media\/instagram/
      Api::InstagramPostsController
    # Add more platforms here
    else
      raise "Unsupported social media platform"
    end
  end
end
