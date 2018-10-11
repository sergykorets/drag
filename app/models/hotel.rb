class Hotel < ApplicationRecord
  GOOGLE_KEY = Rails.application.secrets.google_key || ENV['google_key']
  enum hotel_type: [:lodging, :restaurant]

  has_many :reviews, dependent: :destroy
  has_many :photos, dependent: :destroy
  has_many :phones, dependent: :destroy
  has_many :google_photos
  has_many :google_reviews
  has_many :nearby_hotels

  validates_presence_of :name
  validates_uniqueness_of :google_id

  accepts_nested_attributes_for :phones, allow_destroy: true
  accepts_nested_attributes_for :photos, allow_destroy: true
  accepts_nested_attributes_for :google_photos, allow_destroy: true

  def self.update_hotels
  	google_hotels = []
    client = GooglePlaces::Client.new(GOOGLE_KEY)
  	self.all.each_with_index do |hotel, i|
      puts "#{hotel.name}"
  		google_hotels[i] = HTTParty.get "https://maps.googleapis.com/maps/api/place/details/json?placeid=#{hotel.google_id}&key=#{GOOGLE_KEY}"
      if hotel.google_rating != google_hotels[i]['result']['rating']
        hotel.update_attributes(google_rating: google_hotels[i]['result']['rating'])
      end
      if !google_hotels[i]['result']['reviews'].nil?
        google_hotels[i]['result']['reviews'].each do |review|
          if !GoogleReview.exists?(hotel_id: hotel.id, author_name: review['author_name'])
            GoogleReview.create(hotel_id: hotel.id,
                                author_name: review['author_name'], 
                                profile_photo_url: review['profile_photo_url'],
                                rating: review['rating'],
                                relative_time_description: review['relative_time_description'],
                                text: review['text'],
                                time:review['time'])
          end
        end
      end
      puts "reviews completed"
      if !google_hotels[i]['result']['photos'].nil?
        google_hotels[i]['result']['photos'].each_with_index do |photo,j|
          spot = client.spot(google_hotels[i]['result']['place_id'])
          puts spot.inspect
          url = spot.photos[j].fetch_url(800)
          if !GooglePhoto.exists?(hotel_id: hotel.id, photo_url: url)
            GooglePhoto.create(hotel_id: hotel.id, photo_url: url)
          end
        end
      end
      puts "photos completed"
  	end
  end

  def self.get_hotels
    hotels = []
    area = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?language=uk&type=lodging&key=AIzaSyDM5fHYOgKovob7679oLfv1LGTxRX9xllA&radius=1000&location=48.248731, 24.244108"
    sleep 1
    hotels << area.parsed_response['results']
    new_area = area
    loop do
      new_area = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=AIzaSyDM5fHYOgKovob7679oLfv1LGTxRX9xllA&pagetoken=#{new_area.parsed_response['next_page_token']}"
      sleep 1
      hotels << new_area.parsed_response['results']
      break unless new_area.parsed_response['next_page_token']
    end
    puts hotels.flatten.count
    hotels.flatten.each do |hotel|
      puts hotel['name']
      next if hotel['place_id'] == 'ChIJq-JzLwwQN0cRAhDnwCSXor8' || hotel['place_id'] == 'ChIJx3rHjRAQN0cRdWy5ldbbpGo' || hotel['place_id'] == 'ChIJGd65gRoQN0cRZHpkO6eTDP0'
      Hotel.create(name: hotel['name'], google_id: hotel['place_id'], google_rating: hotel['rating'])
      Hotel.update_coordinates(hotel['place_id'])
    end
  end

  def self.get_restaurants
    ['bar', 'restaurant', 'cafe'].each do |item|
      hotels = []
      area = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?language=uk&type=#{item}&key=#{GOOGLE_KEY}&radius=1000&location=48.248731, 24.244108"
      sleep 1
      hotels << area.parsed_response['results']
      new_area = area
      loop do
        new_area = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=#{GOOGLE_KEY}&pagetoken=#{new_area.parsed_response['next_page_token']}"
        sleep 1
        hotels << new_area.parsed_response['results']
        break unless new_area.parsed_response['next_page_token']
      end
      puts hotels.flatten.count
      hotels.flatten.each do |hotel|
        puts hotel['name']
        Hotel.create(name: hotel['name'], hotel_type: :restaurant, google_id: hotel['place_id'], google_rating: hotel['rating'])
      end
    end
  end

  def self.update_coordinates(place_id)
    place = HTTParty.get "https://maps.googleapis.com/maps/api/geocode/json?place_id=#{place_id}&key=AIzaSyDM5fHYOgKovob7679oLfv1LGTxRX9xllA"
    sleep 1
    Hotel.find_by_google_id(place_id).update_attributes(longitude: place['results'][0]['geometry']['location']['lng'], latitude: place['results'][0]['geometry']['location']['lat'])
  end

  def self.generate_nearbys
    Hotel.all.each do |hotel|
      puts hotel.name
      nearbys = HTTParty.get "https://maps.googleapis.com/maps/api/place/nearbysearch/json?language=uk&key=AIzaSyDM5fHYOgKovob7679oLfv1LGTxRX9xllA&radius=100&location=#{hotel.latitude},#{hotel.longitude}"
      sleep 1
      nearbys['results'].each do |result|
        nearby_hotel = Hotel.find_by_google_id(result['place_id'])
        hotel.nearby_hotels.create(nearby_hotel_id: nearby_hotel.id) if nearby_hotel && hotel.id != nearby_hotel.id
      end
    end
  end
end