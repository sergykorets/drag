class ReservationsController < ApplicationController
  before_action :define_hotel

  def index
    @floors = @hotel.rooms.map {|room| room.floor}.max
    @hotel_id = @hotel.id
    @rooms = @hotel.rooms.in_floor(params[:floor] || 1).each_with_object({}) {|room, hash| hash[room.id] = {
      id: room.id,
      number: room.number,
      floor: room.floor,
      places: room.places,
      reservations: room.reservations.for_dates(room, Date.today, Date.tomorrow).each_with_object({}) {|reservation, hash| hash[reservation.id] = {
        id: reservation.id,
        name: reservation.name,
        phone: reservation.phone,
        places: reservation.places,
        startDate: reservation.start_date,
        endDate: reservation.end_date}
      }
    }}
    respond_to do |format|
      format.html { render :index }
      format.json {{rooms: @rooms }}
    end
  end

  def create
    if room = @hotel.rooms.find_by_id(params[:reservation][:room_id])
      if room.reservations.create(reservation_params)
        render json: {
          success: true,
          rooms: @hotel.rooms.in_floor(params[:reservation][:floor]).each_with_object({}) {|room, hash| hash[room.id] = {
            id: room.id,
            number: room.number,
            floor: room.floor,
            places: room.places,
            reservations: room.reservations.for_dates(room, params[:reservation][:start_date].to_date, params[:reservation][:end_date].to_date).each_with_object({}) {|reservation, hash| hash[reservation.id] = {
              id: reservation.id,
              name: reservation.name,
              phone: reservation.phone,
              places: reservation.places,
              startDate: reservation.start_date,
              endDate: reservation.end_date}
            }
          }
        }}
      else
        render json: {success: false}
      end
    else
      render json: {success: false}
    end
  end

  def update
    reservation = @hotel.reservations.find_by_id(params[:id])
    room = reservation.room
    reservation.update(reservation_params)
    render json: {
      success: true,
      reservations: room.reservations.for_dates(room, Date.today.at_beginning_of_month, Date.today.at_end_of_month).map do |reservation|
        {id: reservation.id,
         title: reservation.name,
         phone: reservation.phone,
         places: reservation.places,
         start: reservation.start_date,
         end: reservation.end_date,
         allDay?: false}
      end
    }
  end

  def destroy
    reservation = @hotel.reservations.find_by_id(params[:id])
    room = reservation.room
    reservation.destroy
    if (params[:from_calendar])
      render json: {
        success: true,
        reservations: room.reservations.for_dates(room, Date.today.at_beginning_of_month, Date.today.at_end_of_month).map do |reservation|
          {id: reservation.id,
           title: reservation.name,
           phone: reservation.phone,
           places: reservation.places,
           start: reservation.start_date,
           end: reservation.end_date,
           allDay?: false}
        end
      }
    else
      render json: {
        success: true,
        rooms: @hotel.rooms.in_floor(params[:floor]).each_with_object({}) {|room, hash| hash[room.id] = {
          id: room.id,
          number: room.number,
          floor: room.floor,
          places: room.places,
          reservations: room.reservations.for_dates(room, params[:start_date].to_date, params[:end_date].to_date).each_with_object({}) {|reservation, hash| hash[reservation.id] = {
            id: reservation.id,
            name: reservation.name,
            phone: reservation.phone,
            places: reservation.places,
            startDate: reservation.start_date,
            endDate: reservation.end_date}
          }
        }
        }}
    end
  end

  def dates
    render json: {
      success: true,
      rooms: @hotel.rooms.in_floor(params[:floor]).each_with_object({}) {|room, hash| hash[room.id] = {
        id: room.id,
        number: room.number,
        floor: room.floor,
        places: room.places,
        reservations: room.reservations.for_dates(room, params[:start_date].to_date, params[:end_date].to_date).each_with_object({}) {|reservation, hash| hash[reservation.id] = {
          id: reservation.id,
          name: reservation.name,
          phone: reservation.phone,
          places: reservation.places,
          startDate: reservation.start_date,
          endDate: reservation.end_date}
        }
      }
      }}
  end

  private

    def reservation_params
      params.require(:reservation).permit(:name, :phone, :places, :start_date, :end_date, :hotel_id)
    end

    def define_hotel
      @hotel = Hotel.friendly.find(params[:hotel_id])
    end
end
