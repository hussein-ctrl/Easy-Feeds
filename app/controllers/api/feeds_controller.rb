class Api::FeedsController < ApplicationController
  before_action :require_login

  # DELETE /api/feeds/:id/remove_from_collections
  def remove_from_collections
    feed_id = params[:id]
    removed = CollectionItem.where(item_type: 'Feed', item_id: feed_id).destroy_all
    render json: { success: true, removed_count: removed.size }
  end

  # POST /api/feeds
  def create
    @feed = Feed.find_by(rss_url: feed_params[:rss_url])
    if @feed
      render json: @feed, status: :ok
      return
    end

    @feed = Feed.new(feed_params)
    if @feed.save
      render json: @feed, status: :created
    else
      render json: { errors: @feed.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /api/feeds?q=...
  def index
    # Include the current_user's subscription (if any) with each feed
    base = Feed
      .joins("LEFT JOIN subscriptions ON subscriptions.feed_id = feeds.id AND subscriptions.subscriber_id = #{current_user.id}")
      .select("feeds.*", "subscriptions.id AS subscription_id")

    if params[:q].present?
      @q = base.ransack(title_or_rss_url_or_description_cont: params[:q])
      @feeds = @q.result.limit(20)
    else
      # Popular feeds not yet followed by the user
      @feeds = base.merge(Feed.popular).where("subscriptions.id IS NULL")
    end
  end

  # GET /api/feeds/:id
  def show
    @feed = Feed.includes(:stories, :subscriptions).find_by(id: params[:id])
    @subscription = @feed&.subscriptions&.find_by(subscriber_id: current_user.id)

    if @feed && (@feed.website_links.blank? || @feed.social_links.blank?)
      @feed.populate_feed_metadata
      @feed.save if @feed.changed?
    end

    render :show
  end

  private

  def feed_params
    params.require(:feed).permit(:rss_url, :title)
  end
end
