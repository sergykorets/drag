class HotelsController < ApplicationController
  before_action :set_hotel, only: [:show, :edit, :update, :nearby, :rooms, :reservation_list]
  before_action :check_session, only: :index
  before_action :authenticate_user!, only: [:create, :edit, :update]

  def index
    set_meta_tags title: "Драгобрат, готелі на карті 3D, ціни, відгуки, схема підйомників, веб камери"
    @admin = Rails.env.development? || (current_user && current_user.admin)
    @hotels = Hotel.lodging.order(position: :asc).map do |hotel|
      { id: hotel.id,
        name: hotel.name,
        price: hotel.price,
        slug: hotel.slug,
        position: hotel.position,
        googleRating: hotel.average_rating,
        location: hotel.location,
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
    @nearby_hotels = []
    @hotel.nearby_hotels.each do |nearby|
      nearby_hotel = Hotel.find_by_id(nearby.nearby_hotel_id)
      @nearby_hotels << {
        id: nearby_hotel.id,
        name: nearby_hotel.name,
        price: nearby_hotel.price,
        slug: nearby_hotel.slug,
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
      hotelType: @hotel.hotel_type,
      googleRating: @hotel.average_rating,
      location: @hotel.location,
      photos: get_hotel_photos,
      sessionComment: params[:comment],
      phones: @hotel.phones.map {|phone| phone.phone},
      googleReviews: combine_reviews}
    @logged = !current_user.nil?
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
        mainPhotoId: @hotel.main_photo_id,
        mainPhotoType: @hotel.main_photo_type,
        photosForUpload: [],
        googlePhotos: @hotel.google_photos.not_deleted.any? ? @hotel.google_photos.not_deleted.map {|photo| {id: photo.id, photo: photo.photo_url}} : [],
        photos: @hotel.photos.any? ? @hotel.photos.map {|photo| {id: photo.id, photo: photo.picture(:large)}} : [],
        phones: @hotel.phones.any? ? @hotel.phones.map {|phone| {id: phone.id, phone: phone.phone}} : [{phone: ''}]}
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
      @h = current_user.hotels.find_by_id(params[:hotel][:id])
    end
    if @h && @h.update(hotel_params)
      render json: { success: true, slug: @hotel.slug }
    else
      render json: { success: false, errors: @hotel.errors.full_messages }
    end
  end

  def reservation_list
    @hotel_id = @hotel.id
    @reservations = @hotel.reservations.for_dates(@hotel, params[:start_date].try(:to_date) || Date.today, params[:end_date].try(:to_date) || Date.tomorrow)
    @rooms = @hotel.rooms.each_with_object({}) {|room, hash| hash[room.id] = {
      number: room.number,
      places: room.places
    }}
    @reservations_paginated = @reservations.page(params[:page] || 1).per(10).each_with_object({}) {|reservation, hash| hash[reservation.id] = {
      id: reservation.id,
      room: Room.find_by_id(reservation.room_id).number,
      roomId: reservation.room_id,
      name: reservation.name,
      phone: reservation.phone,
      places: reservation.places,
      startDate: reservation.start_date.strftime('%d.%m.%Y'),
      endDate: reservation.end_date.strftime('%d.%m.%Y')}
    }
    respond_to do |format|
      format.html { render :reservation_list }
      format.json {{reservations: @reservations_paginated, totalReservationsCount: @reservations }}
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_hotel
      @hotel = Hotel.friendly.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def hotel_params
      params.require(:hotel).permit(:name, :description, :hotel_type, :site, :main_photo_id, :main_photo_type, :price,
                                    rooms_attributes: [:id, :number, :floor, :places, :_destroy], phones_attributes: [:id, :phone, :_destroy],
                                    google_photos_attributes: [:id, :deleted], photos_attributes: [:id, :_destroy, photo: [:picture]])
    end

    def combine_reviews
      a = @hotel.google_reviews.order(time: :desc).map do |review|
        { author: review.author_name,
          avatar: review.profile_photo_url,
          rating: review.rating,
          text: review.text,
          created: DateTime.strptime(review.time.to_s,'%s').strftime('%d.%m.%Y')}
      end
      b = @hotel.reviews.order(created_at: :desc).map do |review|
        { id: review.id,
          author: review.user.name || review.user.email,
          avatar: review.user.remote_avatar_url || review.user.avatar,
          rating: review.rating,
          text: review.comment,
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
      google_photos = @hotel.google_photos.not_deleted.map {|photo| photo.photo_url}
      photos = @hotel.photos.map {|photo| photo.picture}
      google_photos + photos
    end

    def check_session
      if !session[:review_url].blank?
        redirect_to session[:review_url]
        session[:review_url] = ''
      end
    end
end
