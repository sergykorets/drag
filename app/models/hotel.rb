class Hotel < ApplicationRecord
  extend FriendlyId
  friendly_id :name, use: :slugged
  GOOGLE_KEY = Rails.application.secrets.google_key || ENV['google_key']
  enum hotel_type: [:lodging, :restaurant]

  has_many :reviews, dependent: :destroy
  has_many :photos, dependent: :destroy
  has_many :phones, dependent: :destroy
  has_many :google_photos
  has_many :google_reviews
  has_many :nearby_hotels
  has_many :rooms
  has_many :reservations
  belongs_to :user, optional: true
  has_one :ratrak

  validates_presence_of :name
  validates_uniqueness_of :google_id, allow_blank: true, allow_nil: true

  after_update :update_hotel_rating

  accepts_nested_attributes_for :phones, allow_destroy: true
  accepts_nested_attributes_for :photos, allow_destroy: true
  accepts_nested_attributes_for :google_photos, allow_destroy: false
  accepts_nested_attributes_for :rooms, allow_destroy: true

  def self.update_hotels
  	google_hotels = []
    client = GooglePlaces::Client.new(GOOGLE_KEY)
  	self.all.each_with_index do |hotel, i|
      puts "#{hotel.name}"
      if hotel.google_id.present?
        google_hotels[i] = HTTParty.get "https://maps.googleapis.com/maps/api/place/details/json?placeid=#{hotel.google_id}&key=#{GOOGLE_KEY}"
        sleep 1
        if hotel.google_rating != google_hotels[i].try(:[], 'result').try(:[], 'rating')
          hotel.update_attributes(google_rating: google_hotels[i]['result']['rating'])
        end
        if !google_hotels[i]['result']['reviews'].nil?
          google_hotels[i]['result']['reviews'].each do |review|
            if !GoogleReview.exists?(hotel_id: hotel.id, time: review['time'])
              GoogleReview.create(hotel_id: hotel.id,
                                  author_name: review['author_name'],
                                  profile_photo_url: review['profile_photo_url'],
                                  rating: review['rating'],
                                  relative_time_description: review['relative_time_description'],
                                  text: review['text'],
                                  time:review['time'])
            else
              GoogleReview.where(hotel_id: hotel.id, time: review['time']).first.update_column(
                                  :profile_photo_url, review['profile_photo_url'])
            end
          end
        end
        puts "reviews completed"
        if !google_hotels[i]['result']['photos'].nil?
          google_hotels[i]['result']['photos'].each_with_index do |photo,j|
            spot = client.spot(google_hotels[i]['result']['place_id'])
            puts spot.inspect
            url = spot.photos[j].fetch_url(800) if spot.photos[j]
            if !GooglePhoto.exists?(hotel_id: hotel.id, photo_url: url)
              GooglePhoto.create(hotel_id: hotel.id, photo_url: url)
            end
          end
        end
      end
      puts "photos completed"
  	end
  end

  def self.get_hotels
    hotels = []
    ['48.245195, 24.238127', '48.249729, 24.246392'].each do |item|
      area = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?language=uk&type=lodging&key=#{GOOGLE_KEY}&radius=500&location=#{item}"
      sleep 2
      hotels << area.parsed_response['results']
      new_area = area
      loop do
        new_area = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=#{GOOGLE_KEY}&pagetoken=#{new_area.parsed_response['next_page_token']}"
        sleep 2
        hotels << new_area.parsed_response['results']
        break unless new_area.parsed_response['next_page_token']
      end
      puts "********************** #{hotels.flatten.count} *****************************"
      hotels.flatten.each do |hotel|
        puts hotel['name']
        next if hotel['place_id'] == 'ChIJq-JzLwwQN0cRAhDnwCSXor8' || hotel['place_id'] == 'ChIJx3rHjRAQN0cRdWy5ldbbpGo' ||
          hotel['place_id'] == 'ChIJGd65gRoQN0cRZHpkO6eTDP0' || hotel['place_id'] == 'ChIJ05XiUg4QN0cRw0JwMa4Jig0' || hotel['place_id'] == 'ChIJhdeUBBEQN0cR-_57lqTAZvU'
        Hotel.create(name: hotel['name'], google_id: hotel['place_id'], google_rating: hotel['rating'])
        h = Hotel.find_by_google_id(hotel['place_id'])
        h.update_column(:google_rating, hotel['rating']) if h
        #Hotel.update_coordinates(hotel['place_id'])
      end
    end
  end

  def self.get_restaurants
    ['bar', 'restaurant', 'cafe'].each do |item|
      hotels = []
      area = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?language=uk&type=#{item}&key=#{GOOGLE_KEY}&radius=1000&location=48.248731, 24.244108"
      sleep 2
      hotels << area.parsed_response['results']
      new_area = area
      loop do
        new_area = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=#{GOOGLE_KEY}&pagetoken=#{new_area.parsed_response['next_page_token']}"
        sleep 2
        hotels << new_area.parsed_response['results']
        break unless new_area.parsed_response['next_page_token']
      end
      puts hotels.flatten.count
      hotels.flatten.each do |hotel|
        puts hotel['name']
        next if hotel['place_id'] == 'ChIJGd65gRoQN0cRZHpkO6eTDP0' || hotel['place_id'] == 'ChIJVx7i66wRN0cRNGt9GQi8FD8' || hotel['place_id'] == 'ChIJ6aRSNwYRN0cRMvij56gHTSA' || hotel['place_id'] == 'ChIJpWKjGKIRN0cRz1m-xXWBdjQ'
        Hotel.create(name: hotel['name'], hotel_type: :restaurant, google_id: hotel['place_id'], google_rating: hotel['rating'])
        h = Hotel.find_by_google_id(hotel['place_id'])
        h.update_column(:google_rating, hotel['rating']) if h
        #Hotel.update_coordinates(hotel['place_id'])
      end
    end
  end

  def self.update_coordinates(place_id)
    place = HTTParty.get "https://maps.googleapis.com/maps/api/geocode/json?place_id=#{place_id}&key=#{GOOGLE_KEY}"
    sleep 1
    Hotel.find_by_google_id(place_id).update_attributes(longitude: place['results'][0]['geometry']['location']['lng'], latitude: place['results'][0]['geometry']['location']['lat'])
  end

  def self.generate_nearbys
    Hotel.all.each do |hotel|
      puts hotel.name
      if hotel.latitude
        nearbys = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?language=uk&key=#{GOOGLE_KEY}&radius=100&location=#{hotel.latitude},#{hotel.longitude}"
        sleep 1
        nearbys['results'].each do |result|
          nearby_hotel = Hotel.find_by_google_id(result['place_id'])
          if nearby_hotel && hotel.id != nearby_hotel.id &&
            nearby_hotel.google_id != 'ChIJ05XiUg4QN0cRw0JwMa4Jig0' &&
            nearby_hotel.google_id != 'ChIJVx7i66wRN0cRNGt9GQi8FD8' &&
            nearby_hotel.google_id != 'ChIJ6aRSNwYRN0cRMvij56gHTSA' &&
            nearby_hotel.google_id != 'ChIJpWKjGKIRN0cRz1m-xXWBdjQ' &&
            nearby_hotel.google_id != 'ChIJhdeUBBEQN0cR-_57lqTAZvU'
            hotel.nearby_hotels.create(nearby_hotel_id: nearby_hotel.id)
          end
        end
      end
    end
  end

  def update_hotel_rating
    average = self.reviews.average(:rating)
    self.update_column(:site_rating, average)
    site_rating = self.site_rating.try(:to_d)
    google_rating = self.google_rating.try(:to_d)
    if google_rating && site_rating
      self.update_column(:average_rating, (google_rating + site_rating)/2)
    elsif site_rating && !google_rating
      self.update_column(:average_rating, site_rating)
    elsif !site_rating && google_rating
      self.update_column(:average_rating, google_rating)
    else
      self.update_column(:average_rating, 0)
    end
  end
end