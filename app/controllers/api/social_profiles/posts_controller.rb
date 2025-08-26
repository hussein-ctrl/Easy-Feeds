require 'base64'

module Api
  module SocialProfiles
    class PostsController < ApplicationController
      INSTAGRAM_ACCESS_TOKEN = ENV['INSTAGRAM_ACCESS_TOKEN'] # Store in credentials/env
      INSTAGRAM_API_URL = 'https://graph.instagram.com'
      FACEBOOK_API_URL = 'https://graph.facebook.com/v19.0'

      def index
        platform = params[:platform].to_s.downcase
        username = params[:username].to_s.strip
        limit = (params[:limit] || 0).to_i

        Rails.logger.info("[PostsController#index] platform=#{platform}, username=#{username}, limit=#{limit}")

        begin
          posts = case platform
                  when 'instagram'
                    Rails.logger.info("Fetching Instagram posts for @#{username}")
                    fetch_instagram_posts(username)
                  when 'twitter'
                    Rails.logger.info("Fetching Twitter posts for @#{username}")
                    fetch_twitter_posts(username)
                  when 'facebook'
                    Rails.logger.info("Fetching Facebook posts for @#{username}")
                    fetch_facebook_posts(username)
                  else
                    Rails.logger.warn("Unknown platform: #{platform}")
                    []
                  end

          Rails.logger.info("Fetched #{posts.size} posts for platform=#{platform}, username=#{username}")
          render json: { posts: posts }
        rescue => e
          twitter_error = nil
          if platform == 'twitter' && e.message.include?('{')
            begin
              error_json = JSON.parse(e.message[/\{.*\}/m])
              twitter_error = error_json['title'] || error_json['detail'] || error_json['message']
            rescue
              twitter_error = nil
            end
          end
          Rails.logger.error("Error fetching posts for platform=#{platform}, username=#{username}: #{twitter_error || e.message}")
          render json: {
            posts: [],
            error: "Failed to fetch #{platform} posts: #{twitter_error || e.message}",
            suggestion: platform == 'instagram' ? 'Ensure the account is a Business/Creator account' : ''
          }, status: :unprocessable_entity
        end
      end

      private

      # Instagram API Methods


      def fetch_instagram_posts(username)
        user_id = find_instagram_user_id(username)
        if user_id
          posts = fetch_all_instagram_posts(user_id)
          return posts if posts.any?
        end
        Rails.logger.warn("Instagram user_id not found or no posts for @#{username}, falling back to scraping.")
        fetch_via_scraping(username, 50)
      rescue => e
        Rails.logger.error("Instagram fetch failed for @#{username}: #{e.message}")
        fetch_via_scraping(username, 50)
      end


      # Fetch all posts for a user by paginating through Instagram API
      def fetch_all_instagram_posts(user_id)
        posts = []
        next_url = "#{INSTAGRAM_API_URL}/#{user_id}/media?fields=id,caption,media_url,permalink,timestamp,media_type&access_token=#{INSTAGRAM_ACCESS_TOKEN}"
        page = 0
        loop do
          page += 1
          Rails.logger.info("Instagram API request page=#{page}, url=#{next_url}")
          response = HTTParty.get(next_url, timeout: 10)
          unless response.success?
            error = parse_api_error(response)
            Rails.logger.error("Instagram API error: #{error}")
            raise "API Error: #{error}"
          end
          data = JSON.parse(response.body)
          posts += (data['data'] || []).map do |post|
            {
              id: post['id'],
              content: post['caption'] || '',
              date: post['timestamp'],
              image: post['media_url'],
              url: post['permalink'],
              media_type: post['media_type'],
              platform: 'instagram'
            }
          end
          paging = data['paging']
          if paging && paging['next']
            next_url = paging['next']
          else
            break
          end
        end
        Rails.logger.info("Fetched #{posts.size} Instagram posts for user_id=#{user_id}")
        posts
      end

      def find_instagram_user_id(username)
        # First check if we have it cached
        Rails.cache.fetch("instagram_user_id_#{username}", expires_in: 1.day) do
          url = "#{FACEBOOK_API_URL}/#{username}?fields=id&access_token=#{INSTAGRAM_ACCESS_TOKEN}"
          Rails.logger.info("Looking up Instagram user_id for @#{username} via Facebook API")
          response = HTTParty.get(url)
          if response.success?
            id = JSON.parse(response.body)['id']
            Rails.logger.info("Found Instagram user_id=#{id} for @#{username}")
            id
          else
            Rails.logger.warn("Instagram user_id not found for @#{username}. Response: #{response.body}")
            nil
          end
        end
      end

      # Scraping Fallback
      def fetch_via_scraping(username, limit)
        # In production, use a service like Apify or ScraperAPI
        # This is just a mock implementation
        Rails.logger.warn("Falling back to scraping for @#{username}, limit=#{limit}")
        limit.times.map do |i|
          {
            id: "scraped_#{i}",
            content: "Sample post #{i+1} for @#{username} (scraped fallback)",
            date: (Time.now - i.days).iso8601,
            image: "https://source.unsplash.com/random/800x800/?instagram,#{i}",
            url: "https://instagram.com/p/#{SecureRandom.hex(8)}",
            platform: 'instagram'
          }
        end
      end


      # Twitter API Integration

      def twitter_bearer_token
        key = ENV['TWITTER_API_KEY']
        secret = ENV['TWITTER_API_SECRET']
        credentials = Base64.strict_encode64("#{key}:#{secret}")
        response = HTTParty.post(
          'https://api.twitter.com/oauth2/token',
          headers: { 'Authorization' => "Basic #{credentials}", 'Content-Type' => 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: 'grant_type=client_credentials'
        )
        JSON.parse(response.body)['access_token']
      end

      def fetch_twitter_posts(username)
        bearer_token = twitter_bearer_token
        user_url = "https://api.twitter.com/2/users/by/username/#{username}"
        Rails.logger.info("Looking up Twitter user_id for @#{username}")
        user_resp = HTTParty.get(user_url, headers: { 'Authorization' => "Bearer #{bearer_token}" })
        Rails.logger.info("Twitter user lookup response: #{user_resp.body}")
        user_data = JSON.parse(user_resp.body)
        user_id = user_data.dig('data', 'id')
        unless user_id
          Rails.logger.error("Twitter user not found for @#{username}. Response: #{user_resp.body}")
          raise "Twitter user not found: #{user_resp.body}"
        end

        all_tweets = []
        next_token = nil
        max_pages = 32
        page = 0
        begin
          page += 1
          tweets_url = "https://api.twitter.com/2/users/#{user_id}/tweets?tweet.fields=created_at&max_results=100"
          tweets_url += "&pagination_token=#{next_token}" if next_token
          Rails.logger.info("Fetching Twitter tweets page=#{page} for user_id=#{user_id}")
          tweets_resp = HTTParty.get(tweets_url, headers: { 'Authorization' => "Bearer #{bearer_token}" })
          tweets_data = JSON.parse(tweets_resp.body)
          unless tweets_data['data']
            Rails.logger.error("No tweets found or error for @#{username}. Response: #{tweets_resp.body}")
            break
          end
          all_tweets += tweets_data['data'].map do |tweet|
            {
              id: tweet['id'],
              content: tweet['text'],
              date: tweet['created_at'],
              image: nil,
              url: "https://twitter.com/#{username}/status/#{tweet['id']}",
              platform: 'twitter'
            }
          end
          next_token = tweets_data.dig('meta', 'next_token')
        end while next_token && page < max_pages
        Rails.logger.info("Fetched #{all_tweets.size} tweets for @#{username}")
        all_tweets
      rescue => e
        Rails.logger.error("Twitter fetch failed for @#{username}: #{e.message}\nBacktrace: #{e.backtrace.join("\n")}")
        raise "Twitter: #{e.message}"
      end

      # Facebook Placeholder

      def fetch_facebook_posts(username)
        # Mock implementation: returns 50 sample Facebook posts with image and description
        Rails.logger.warn("Mock fetching Facebook posts for @#{username}")
        50.times.map do |i|
          {
            id: "facebook_#{i}",
            content: "Sample Facebook post #{i+1} for @#{username} (mock)",
            date: (Time.now - i.days).iso8601,
            image: "https://source.unsplash.com/random/800x800/?facebook,#{i}",
            url: "https://facebook.com/#{username}/posts/#{1000000 + i}",
            platform: 'facebook'
          }
        end
      end

      # Helper Methods
      def parse_api_error(response)
        begin
          error = JSON.parse(response.body)['error']
          "#{error['message']} (Code #{error['code']})"
        rescue
          "Unknown API error - #{response.body}"
        end
      end
    end
  end
end