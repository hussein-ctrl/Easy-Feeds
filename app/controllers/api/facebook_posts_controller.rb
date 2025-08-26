module Api
  class FacebookPostsController < ApplicationController
    before_action :require_login
    require 'httparty'

    APIFY_API_TOKEN = ENV['APIFY_API_TOKEN'] || 'apify_api_0kXkpCei4G7PenugRfAg5He4jayQdJ445AKJ'
    TASK_ID = 'bushy_xenotime~facebook-posts-scraper-task'

    def self.handle_request(params)

      username_param = params[:username] || params['username']
      results_limit = params[:resultsLimit]&.to_i || 40
      min_date = params[:minDate] || params['minDate']
      max_date = params[:maxDate] || params['maxDate']

      unless username_param.present? && username_param != "null"
        return { error: "Missing 'username' parameter" }
      end

      run_task_url = "https://api.apify.com/v2/actor-tasks/#{TASK_ID}/run-sync-get-dataset-items?token=#{APIFY_API_TOKEN}"

      request_body = {
        resultsLimit: results_limit,
        captionText: false
      }

      request_body[:onlyPostsNewerThan] = min_date if min_date.present?
      request_body[:onlyPostsOlderThan] = max_date if max_date.present?

      # Bind startUrls to username_param (single value)
      request_body[:startUrls] = [
        {
          url: "https://www.facebook.com/#{username_param}",
          method: "GET"
        }
      ]

      response = HTTParty.post(
        run_task_url,
        headers: { 'Content-Type' => 'application/json' },
        body: request_body.to_json
      )

      unless [200, 201].include?(response.code)
        return { error: 'Failed to fetch Facebook posts', details: response.body }
      end

      all_data = response.parsed_response
      {
        totalCount: all_data.size,
        posts: all_data
      }
    rescue => e
      { error: 'Apify request failed', details: e.message }
    end
  end
end
