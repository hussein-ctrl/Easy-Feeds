class Api::StoriesController < ApplicationController
  before_action :require_login

  def index
  Rails.logger.info "StoriesController#index called by user_id=#{current_user.id}, offset=#{params[:offset]}"
  Rails.logger.debug "Checking user subscriptions..."
    offset = params[:offset].to_i
    if current_user.subscriptions.empty?
    Rails.logger.debug "No subscriptions found for user_id=#{current_user.id}. Returning empty stories list."
    @stories = []
    else
    Rails.logger.debug "User has subscriptions. Building reads_join SQL..."
      reads_join = "LEFT JOIN reads
      ON reads.story_id = stories.id
      AND reads.reader_id = #{current_user.id}"

    Rails.logger.debug "Fetching stories for user_id=#{current_user.id} with offset=#{offset}..."
      @stories = current_user.stories
        .select("stories.*, reads.reader_id as read")
        .joins(reads_join)
        .where("reads.id IS NULL
               OR reads.updated_at > :within_last_three_minutes",
               within_last_three_minutes: Time.now - 180)
        .order('pub_datetime DESC')
        .limit(20)
        .includes(:feed, :subscriptions)
        .offset(offset)
    Rails.logger.debug "Fetched #{@stories.size} stories for user_id=#{current_user.id}."
    end
  Rails.logger.debug "Rendering stories index for user_id=#{current_user.id}."
    render "api/stories/index"
  end

  def show
  Rails.logger.info "StoriesController#show called by user_id=#{current_user.id}, story_id=#{params[:id]}"
  Rails.logger.debug "Building reads_join SQL for story show..."
    reads_join = "LEFT JOIN reads
    ON reads.story_id = stories.id
    AND reads.reader_id = #{current_user.id}"

  Rails.logger.debug "Fetching story id=#{params[:id]} for user_id=#{current_user.id}..."
    @story = Story
      .select("stories.*, reads.reader_id as read")
      .joins(reads_join)
      .includes(:feed, :subscriptions)
      .find_by(id: params[:id])

    if @story
    Rails.logger.debug "Story found: id=#{@story.id} for user_id=#{current_user.id}. Rendering show."
      render :show
    else
    Rails.logger.warn "Story not found: id=#{params[:id]} for user_id=#{current_user.id}."
      render json: ["Cannot find story"], status: 404
    end
  end

end
