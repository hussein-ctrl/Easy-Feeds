all_stories = []

reads_join = <<-SQL.squish
  LEFT OUTER JOIN reads
  ON reads.story_id = stories.id
  AND reads.reader_id = #{current_user.id}
SQL

# Stories (normalized)
json.stories({})
json.stories do
  json.byId({})
  json.byId do
    stories = @feed.stories
      .select("stories.*, reads.reader_id as read")
      .joins(reads_join)
      .order('pub_datetime DESC')
      .limit(20)

    stories.each do |story|
      all_stories << story
      json.set! story.id do
        json.partial! 'api/stories/story', story: story
      end
    end
  end

  json.allIds all_stories.sort_by(&:pub_datetime).map(&:id).reverse
end

# Feed (normalized)
json.feeds do
  json.byId do
    json.set! @feed.id do
      json.partial! 'api/feeds/feed', feed: @feed

      # attach story ids
      json.stories all_stories.sort_by(&:pub_datetime).map(&:id).reverse

      # Subscription info on show as well
      json.subscription_id(@subscription&.id)
      json.subscribed(@subscription.present?)
    end
  end
  json.allIds [@feed.id]
end

# (Optional) If you keep a subscriptions block elsewhere, you can remove it.
# The show payload above already includes `subscription_id` and `subscribed`.
