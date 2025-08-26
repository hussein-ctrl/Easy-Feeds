class Api::ReadsController < ApplicationController
  before_action :require_login

  def index
    # returns recently READ stories
    @stories = current_user.stories
      .select("stories.*, reads.reader_id as read")
      .joins(reads_join)
      .where("reads.id IS NOT NULL")
      .order('reads.updated_at DESC')
      .limit(20)
      .offset(params[:offset])
      .includes(:feed, :subscriptions)
    render "api/stories/index"
  end

  def create
    @read = Read.new(
      story_id: read_params[:story_id],
      reader_id: current_user.id
    )
    begin
      if @read.save
        @story = Story
          .select("stories.*, reads.reader_id as read")
          .joins(reads_join)
          .includes(:feed, :subscriptions)
          .find_by(id: read_params[:story_id])
        render "api/stories/show"
      else
        render json: @read.errors.full_messages, status: 422
      end
    rescue ActiveRecord::RecordNotUnique
      # Already marked as read, return success (idempotent)
      existing = Read.find_by(reader_id: current_user.id, story_id: read_params[:story_id])
      if existing
        @story = Story
          .select("stories.*, reads.reader_id as read")
          .joins(reads_join)
          .includes(:feed, :subscriptions)
          .find_by(id: read_params[:story_id])
        render "api/stories/show"
      else
        render json: ["Could not mark as read"], status: 422
      end
    end
  end

  def reads_join
    "LEFT OUTER JOIN reads
    ON reads.story_id = stories.id
    AND reads.reader_id = #{current_user.id}"
  end

  def destroy
    @read = current_user.reads.find_by(story_id: params[:id])

    if @read
      @read.destroy
      @story = Story
        .select("stories.*, reads.reader_id as read")
        .joins(reads_join)
        .includes(:feed, :subscriptions)
        .find_by(id: params[:id])
      render "api/stories/show"
    else
      render json: ["Read does not exist"], status: 404
    end
  end

  def read_params
    params.require(:read).permit(:story_id)
  end

end
