# frozen_string_literal: true

module Api
  class InstagramPostsController < ApplicationController
    before_action :require_login
    require 'httparty'

    APIFY_API_TOKEN = ENV['APIFY_API_TOKEN'] || 'apify_api_0kXkpCei4G7PenugRfAg5He4jayQdJ445AKJ'
    TASK_ID = 'bushy_xenotime~instagram-post-scraper-task'

    def self.handle_request(params)
      username_param = params[:username] || params['username']
      results_limit = params[:resultsLimit]&.to_i || 40
      only_posts_newer_than = params[:onlyPostsNewerThan]
      skip_pinned_posts = ActiveModel::Type::Boolean.new.cast(params[:skipPinnedPosts])

      unless username_param.present?
        return { error: "Missing 'username' parameter" }
      end

      usernames = Array(username_param)

      run_task_url = "https://api.apify.com/v2/actor-tasks/#{TASK_ID}/run-sync-get-dataset-items?token=#{APIFY_API_TOKEN}"

      request_body = {
        username: usernames,
        resultsLimit: results_limit
      }

      request_body[:onlyPostsNewerThan] = only_posts_newer_than if only_posts_newer_than.present?
      request_body[:skipPinnedPosts] = skip_pinned_posts unless params[:skipPinnedPosts].nil?

      response = HTTParty.post(
        run_task_url,
        headers: { 'Content-Type' => 'application/json' },
        body: request_body.to_json
      )

      unless [200, 201].include?(response.code)
        return { error: 'Failed to fetch Instagram posts', details: response.body }
      end

      all_data = response.parsed_response
      {
        totalCount: all_data.size,
        posts: all_data
      }
    rescue => e
      { error: 'Apify request failed', details: e.message }
    end

    def show
      username_param = params[:username] || request.query_parameters[:username]
      results_limit = params[:resultsLimit]&.to_i || 40
      only_posts_newer_than = params[:onlyPostsNewerThan]
      skip_pinned_posts = ActiveModel::Type::Boolean.new.cast(params[:skipPinnedPosts])

      unless username_param.present?
        Rails.logger.warn("[InstagramPostsController] Missing 'username' parameter")
        return render json: { error: "Missing 'username' parameter" }, status: :bad_request
      end

      usernames = Array(username_param)

      run_task_url = "https://api.apify.com/v2/actor-tasks/#{TASK_ID}/run-sync-get-dataset-items?token=#{APIFY_API_TOKEN}"

      request_body = {
        username: usernames,
        resultsLimit: results_limit
      }

      request_body[:onlyPostsNewerThan] = only_posts_newer_than if only_posts_newer_than.present?
      request_body[:skipPinnedPosts] = skip_pinned_posts unless params[:skipPinnedPosts].nil?

      Rails.logger.info("[InstagramPostsController] Sending request to Apify for usernames: #{usernames.join(', ')}")

      response = HTTParty.post(
        run_task_url,
        headers: { 'Content-Type' => 'application/json' },
        body: request_body.to_json
      )

      unless [200, 201].include?(response.code)
        Rails.logger.error("[InstagramPostsController] Apify error: #{response.body}")
        return render json: { error: 'Failed to fetch Instagram posts', details: response.body }, status: :internal_server_error
      end

      all_data = response.parsed_response

      render json: {
        totalCount: all_data.size,
        posts: all_data
      }
    rescue => e
      Rails.logger.error("[InstagramPostsController] Unexpected error: #{e.class} - #{e.message}")
      render json: { error: 'Apify request failed', details: e.message }, status: :internal_server_error
    end
  end
end
