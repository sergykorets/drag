class HotelsController < ApplicationController
  layout 'hotel_admin', only: :ratrak
  before_action :set_hotel, only: [:show, :edit, :update, :nearby, :rooms, :reservation_list, :booked_dates, :get_available_rooms, :ratrak]
  before_action :check_session, only: :index
  before_action :authenticate_user!, only: [:create, :edit, :update]

  def index
    set_meta_tags title: "Драгобрат, готелі на карті 3D, ціни, відгуки, схема підйомників, веб камери"
    @admin = Rails.env.development? || (current_user && current_user.admin)
    hotels = Hotel.lodging.order("RANDOM()")
    @max_price = hotels.pluck(:price).compact.max
    @min_price = hotels.pluck(:price).compact.min
    @hotels = hotels.map do |hotel|
      { id: hotel.id,
        name: hotel.name,
        price: hotel.price,
        slug: hotel.slug,
        position: hotel.position,
        lat: hotel.latitude,
        sauna: hotel.sauna,
        chan: hotel.chan,
        disco: hotel.disco,
        allowBooking: hotel.allow_booking,
        lng: hotel.longitude,
        googleRating: hotel.average_rating,
        location: hotel.location,
        position: hotel.position,
        avatar: get_hotel_avatar(hotel)}
    end
    respond_to do |format|
      format.html { render :index }
    end
  end

  def show
    set_meta_tags title: "#{@hotel.name} | Драгобрат",
                  description: "#{@hotel.name} драгобрат",
                  keywords: "#{@hotel.name} драгобрат"
    @admin = Rails.env.development? || (current_user && current_user.admin)
    @owner = (current_user && @hotel.user == current_user)
    @logged = !current_user.nil?
    @user_name = current_user.try(:name)
    @nearby_hotels = []
    @hotel.nearby_hotels.each do |nearby|
      nearby_hotel = Hotel.find_by_id(nearby.nearby_hotel_id)
      @nearby_hotels << {
        id: nearby_hotel.id,
        name: nearby_hotel.name,
        price: nearby_hotel.price,
        slug: nearby_hotel.slug,
        sauna: nearby_hotel.sauna,
        chan: nearby_hotel.chan,
        disco: nearby_hotel.disco,
        allowBooking: nearby_hotel.allow_booking,
        googleRating: nearby_hotel.average_rating,
        location: nearby_hotel.location,
        type: nearby_hotel.hotel_type,
        avatar: get_hotel_avatar(nearby_hotel)}
    end
    @h = {
      id: @hotel.id,
      editable: (current_user && current_user.admin) || (current_user && current_user.id == @hotel.user_id),
      name: @hotel.name,
      bookingLink: @hotel.booking_link,
      description: @hotel.description,
      created: @hotel.created_at,
      price: @hotel.price,
      site: @hotel.site,
      slug: @hotel.slug,
      lng: @hotel.longitude,
      lat: @hotel.latitude,
      sauna: @hotel.sauna,
      chan: @hotel.chan,
      disco: @hotel.disco,
      allowBooking: @hotel.allow_booking,
      autoBooking: @hotel.auto_booking,
      hotelType: @hotel.hotel_type,
      googleRating: @hotel.average_rating,
      location: @hotel.location,
      photos: get_hotel_photos,
      sessionComment: params[:comment],
      phones: @hotel.phones.map {|phone| phone.phone},
      googleReviews: combine_reviews}
    respond_to do |format|
      format.html { render :show }
    end
  end

  def new; end

  def edit
    if (current_user && current_user.admin) || (current_user && current_user.id == @hotel.user_id)
      @hotel = {
        id: @hotel.id,
        name: @hotel.name,
        description: @hotel.description || '',
        hotelType: @hotel.hotel_type,
        price: @hotel.price || '',
        site: @hotel.site || '',
        slug: @hotel.slug,
        sauna: @hotel.sauna,
        chan: @hotel.chan,
        disco: @hotel.disco,
        mainPhotoId: @hotel.main_photo_id,
        mainPhotoType: @hotel.main_photo_type,
        photosForUpload: [],
        googlePhotos: @hotel.google_photos.not_deleted.any? ? @hotel.google_photos.not_deleted.each_with_object({}) {|photo, hash| hash[photo.id] = {
          id: photo.id, photo: photo.photo_url, name: photo.name}} : {},
        photos: @hotel.photos.any? ? @hotel.photos.each_with_object({}) {|photo, hash| hash[photo.id] = {
          id: photo.id, name: photo.name, photo: photo.picture(:large)}} : {},
        phones: @hotel.phones.any? ? @hotel.phones.each_with_object({}) {|phone, hash| hash[phone.id] = {
          id: phone.id, phone: phone.phone}} : {}
      }
    else
      redirect_to hotel_path(@hotel)
    end
  end

  def create
    @hotel = current_user.hotels.new(hotel_params)
    if @hotel.save
      render json: { success: true, slug: @hotel.slug }
    else
      render json: { success: false, errors: @hotel.errors.full_messages }
    end
  end

  def update
    if current_user.admin
      @h = @hotel
    else
      @h = current_user.hotels.friendly.find(params[:id])
    end
    if @h && @h.update(hotel_params)
      render json: { success: true, slug: @hotel.slug }
    else
      render json: { success: false, errors: @hotel.errors.full_messages }
    end
  end

  def booked_dates
    blocked_dates = []
    hotel_places = @hotel.rooms.count
    date = params[:date] ? params[:date].to_date : Date.today
    if params[:room_id]
      room = Room.find_by_id(params[:room_id])
      (date.beginning_of_month..date.end_of_month).each do |day|
        reserved = if params[:reservation_id].present?
          room.reservations.approved.where('start_date < ? AND end_date > ? AND id NOT IN (?)', day.tomorrow, day, [params[:reservation_id]]).map {|r| r.places}.sum
        else
          room.reservations.approved.where('start_date < ? AND end_date > ?', day.tomorrow, day).map {|r| r.places}.sum
        end
        blocked_dates << day if reserved >= room.places
      end
    else
      (date.beginning_of_month..date.end_of_month).each do |day|
        reserved = @hotel.reservations.approved.where('start_date < ? AND end_date > ?', day.tomorrow, day).map {|r| r.room_id}.uniq.count
        blocked_dates << day if reserved >= hotel_places
      end
    end
    render json: {success: true, blockedDates: blocked_dates }
  end

  def get_available_rooms
    hotel_rooms = @hotel.rooms.order(:number).to_a
    reservations = @hotel.reservations.approved.where('start_date < ? AND end_date > ?', params[:end_date], params[:start_date])
    reserved_rooms = reservations.map {|r| Room.find_by_id(r.room_id)}.uniq.to_a
    available_rooms = (hotel_rooms - reserved_rooms).map do |room|
      { id: room.id,
        floor: room.floor,
        bigBed: room.big_bed,
        places: room.places,
        number: room.number}
    end
    render json: {success: true, availableRooms: available_rooms }
  end

  def ratrak
    ratrak = @hotel.ratrak
    @ratrak = ratrak.attributes
    @reservations = ratrak.reservations.approved.where('start_date < ? AND end_date > ?', params[:date].try(:to_date).try(:at_end_of_month) || Date.today.at_end_of_month, params[:date].try(:to_date).try(:at_beginning_of_month) || Date.today.at_beginning_of_month).map do |reservation|
      {id: reservation.id,
       name: reservation.name,
       title: "#{reservation.name} - #{reservation.places}",
       phone: reservation.phone,
       places: reservation.places,
       description: reservation.description,
       deposit: reservation.deposit,
       start: (reservation.start_date.to_datetime + Time.parse("12:00").seconds_since_midnight.seconds).strftime('%Y-%m-%d %H:%M'),
       end: (reservation.end_date.to_datetime + Time.parse("12:00").seconds_since_midnight.seconds).strftime('%Y-%m-%d %H:%M'),
       allDay: false}
    end
    respond_to do |format|
      format.html { render :ratrak }
      format.json {{reservations: @reservations, ratrak: @ratrak }}
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_hotel
      @hotel = Hotel.friendly.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def hotel_params
      params.require(:hotel).permit(:name, :description, :hotel_type, :site, :main_photo_id, :main_photo_type, :price, :sauna, :chan, :disco,
                                    :allow_booking, :auto_booking,
                                    rooms_attributes: [:id, :number, :floor, :big_bed, :places, :_destroy], phones_attributes: [:id, :phone, :_destroy],
                                    google_photos_attributes: [:id, :name, :deleted], photos_attributes: [:id, :name, :_destroy, photo: [:picture]])
    end

    def combine_reviews
      a = @hotel.google_reviews.order(time: :desc).map do |review|
        { id: review.id,
          google: true,
          author: review.author_name,
          avatar: review.profile_photo_url,
          rating: review.rating,
          text: review.text,
          reply: review.reply && {
            id: review.reply.id,
            avatar: review.reply.user.remote_avatar_url.present? ? review.reply.user.remote_avatar_url : review.reply.user.avatar.url(:thumb),
            author: review.reply.user.name || review.reply.user.email,
            body: review.reply.body,
            destroyable: current_user == review.reply.user},
          created: DateTime.strptime(review.time.to_s,'%s').strftime('%d.%m.%Y')}
      end
      b = @hotel.reviews.order(created_at: :desc).map do |review|
        { id: review.id,
          google: false,
          author: review.user.name || review.user.email,
          avatar: review.user.remote_avatar_url.present? ? review.user.remote_avatar_url : review.user.avatar,
          rating: review.rating,
          text: review.comment,
          reply: review.reply && {
            id: review.reply.id,
            avatar: review.reply.user.remote_avatar_url.present? ? review.reply.user.remote_avatar_url : review.reply.user.avatar.url(:thumb),
            author: review.reply.user.name || review.reply.user.email,
            body: review.reply.body,
            destroyable: current_user == review.reply.user},
          destroyable: current_user == review.user,
          created: review.created_at.strftime('%d.%m.%Y')}
      end
      (a + b).sort_by do |item|
        item[:created].to_date
      end.reverse
    end

    def get_hotel_avatar(hotel)
      if hotel.main_photo_type.present?
        if hotel.main_photo_type == 'Photos'
          Photo.find_by_id(hotel.main_photo_id).try(:picture)
        else
          GooglePhoto.find_by_id(hotel.main_photo_id).try(:photo_url)
        end
      else
        GooglePhoto.find_by_id(hotel.main_photo_id).try(:photo_url) || Photo.find_by_id(hotel.main_photo_id).try(:photo_url) ||
          hotel.google_photos.try(:first).try(:photo_url) || hotel.photos.try(:first).try(:picture)
      end
    end

    def get_hotel_photos
      google_photos = @hotel.google_photos.not_deleted.map {|photo| {photo: photo.photo_url, name: photo.name}}
      photos = @hotel.photos.map {|photo| {photo: photo.picture, name: photo.name}}
      google_photos + photos
    end

    def check_session
      if !session[:review_url].blank?
        redirect_to session[:review_url]
        session[:review_url] = ''
      end
    end
end
