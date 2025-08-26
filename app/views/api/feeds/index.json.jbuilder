# Ordered list of feed ids
json.results @feeds.map(&:id)

# Normalized feeds payload
json.feeds({ byId: {} })
json.feeds do
  json.byId do
    @feeds.each do |feed|
      json.set! feed.id do
        json.partial! 'api/feeds/feed', feed: feed
        json.stories([])

        # Subscription info from SQL alias
        sub_id = feed.read_attribute('subscription_id')
        json.subscription_id sub_id
        json.subscribed sub_id.present?
      end
    end
  end
end
