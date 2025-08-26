# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)
require 'faker'
require 'feedjira'
require 'open-uri'

Feed.destroy_all
puts "Destroyed all feeds!"
seed_urls = [
  "http://feeds.bbci.co.uk/news/world/rss.xml",
  "http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
  "http://rss.nytimes.com/services/xml/rss/nyt/NYRegion.xml",
  "http://www.politico.com/rss/congress.xml",
  "https://www.polygon.com/rss/index.xml",
  "http://feeds.feedburner.com/TechCrunch/",
  "http://www.techradar.com/rss",
  "https://blog.github.com/blog.atom",
  "http://www.espn.com/espn/rss/news",
  "https://www.theringer.com/rss/index.xml",
  "https://www.boston.com/tag/local-news/feed",
  "https://www.politico.com/rss/politics08.xml",
  "https://feeds.thedailybeast.com/summary/rss/articles",
  "https://www.wired.com/feed/rss",
]

feeds = seed_urls.map do |url|
  puts "Fetching and parsing #{url}"
  f = Feed.new(rss_url: url)
  if f.save
    puts "Fetch and parsing #{url} succeeded!"
    f
  else
    puts "Fetch and parsing #{url} failed!"
  end
end
.compact!

Story.destroy_all
puts "Destroyed all stories!"

feeds.each do |feed|
  begin
    feed_data = Feedjira.parse(URI.open(feed.rss_url).read)
    feed_data.entries.each do |entry|
      Story.create!(
        feed: feed,
        entry_id: entry.respond_to?(:entry_id) ? entry.entry_id : (entry.respond_to?(:id) ? entry.id : SecureRandom.uuid),
        title: entry.title,
        author: entry.respond_to?(:author) ? entry.author : nil,
        summary: entry.summary || entry.content || "",
        link_url: entry.url,
        image_url: entry.respond_to?(:image) ? entry.image : nil,
        pub_datetime: entry.published || entry.pubDate || Time.now,
        teaser: entry.title
      )
    end
  rescue => e
    puts "Error parsing stories for #{feed.rss_url}: #{e.message}"
  end
end
puts "Seeded real stories for each feed!"
