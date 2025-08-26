class Api::SubscriptionsController < ApplicationController
  before_action :require_login

    # POST /api/subscriptions/subscribe_existing_feed
  def subscribe_existing_feed
    feed_id = params[:feed_id]
    feed = Feed.find_by(id: feed_id)
    unless feed
      render json: ["Feed not found."], status: 404 and return
    end
    # Check if already subscribed
    existing = current_user.subscriptions.find_by(feed_id: feed.id)
    if existing
      render json: ["Already subscribed."], status: 422 and return
    end
    subscription = current_user.subscriptions.build(feed_id: feed.id)
    if subscription.save
      @subscription = subscription
      render :show
    else
      render json: subscription.errors.full_messages, status: 422
    end
  end

  def index
    @subscriptions ||= current_user.subscriptions.includes(:feed)
  end

  def show
    @subscription = current_user.subscription_by_feed(params[:id])
    if @subscription
      @feed = @subscription.feed
      @stories = @feed.stories # or whatever association you use
      render :show
    else
      render json: ["Subscription not found."], status: 404
    end
  end

  def update
    @subscription = current_user.subscriptions.find_by(id: params[:id])
    Rails.logger.info "Attempting to update subscription id=#{params[:id]} with params: #{subscription_params.inspect}" 
    if @subscription&.update(subscription_params)
      Rails.logger.info "Subscription updated: #{@subscription.inspect}"
      render json: { id: @subscription.id, title: @subscription.title, feed_id: @subscription.feed_id }, status: :ok
    else
      Rails.logger.error "Subscription update failed: #{@subscription&.errors&.full_messages.inspect}"
      render json: @subscription&.errors&.full_messages || ["Subscription not found"], status: 422
    end
  end

  def create
    @subscription = Subscription.build_by_rss_url(
      rss_url: subscription_params[:rss_url],
      subscriber: current_user
    )

    if @subscription.is_a?(Feed) && @subscription.errors.any?
      render json: @subscription.errors.full_messages, status: 422
    elsif @subscription.save
      render :show
    else
      render json: @subscription.errors.full_messages, status: 422
    end
  end

  def destroy
    @subscription = current_user.subscriptions.find_by(id: params[:id])
    Rails.logger.info "Attempting to destroy subscription id=#{params[:id]}"
    if @subscription
      feed = @subscription.feed
      @subscription.destroy!
      Rails.logger.info "Subscription destroyed: id=#{params[:id]}"
      # Return feed object with subscribed: false for frontend state update
      feed_json = feed.as_json(only: [:id, :title, :favicon_url, :website_url, :description, :image_url, :status, :rss_url])
      feed_json[:subscribed] = false
      render json: { feeds: { byId: { feed.id => feed_json }, allIds: [feed.id] } }, status: :ok
    else
      Rails.logger.warn "Subscription destroy failed: id=#{params[:id]} not found"
      render json: ["Subscription no longer exists"], status: 404
    end
  end

  def refresh
    @subscription = current_user.subscriptions.find_by(feed_id: params[:id])
    @subscription = @subscription.feed.populate_entries if @subscription
  end

  def refresh_all
    @subs = current_user.subscriptions.includes(:feed, :stories)
    @subs.each(&:populate_entries)
  end

  private

  def subscription_params
    params.require(:subscription).permit(:id, :rss_url, :title)
  end
end