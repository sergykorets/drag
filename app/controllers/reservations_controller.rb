class ReservationsController < ApplicationController
  before_action :define_hotel

  def index
    @floors = @hotel.rooms.map {|room| room.floor}.max
    @hotel_id = @hotel.id
    @rooms = @hotel.rooms.in_floor(params[:floor] || 1).each_with_object({}) {|room, hash|
      reservations = room.reservations.for_dates(room, Date.today.to_date, Date.tomorrow.to_date)
      hash[room.id] = {
        id: room.id,
        number: room.number,
        floor: room.floor,
        places: room.places,
        booked: reservations.pluck(:places).sum,
        reservations: reservations.each_with_object({}) {|reservation, hash| hash[reservation.id] = {
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
      r = room.reservations.create(reservation_params)
      if r.persisted?
        if params[:from_calendar]
          render json: {
            success: true,
            reservations: room.reservations.for_dates(room, params[:date].try(:to_date).try(:at_beginning_of_month) || Date.today.at_beginning_of_month, params[:date].try(:to_date).try(:at_end_of_month) || Date.today.at_end_of_month).map do |reservation|
              {id: reservation.id,
               title: reservation.name,
               phone: reservation.phone,
               places: reservation.places,
               start: reservation.start_date,
               end: reservation.end_date,
               allDay: false}
            end
          }
        elsif params[:from_list]
          render json: {
            success: true,
            reservations: @hotel.reservations.for_dates(@hotel, params[:start_date].try(:to_date), params[:end_date].try(:to_date)).map do |reservation|
              {id: reservation.id,
               name: reservation.name,
               room: Room.find_by_id(reservation.room_id).number,
               roomId: reservation.room_id,
               phone: reservation.phone,
               places: reservation.places,
               startDate: reservation.start_date.strftime('%d.%m.%Y'),
               endDate: reservation.end_date.strftime('%d.%m.%Y')}
            end
          }
        else
          render json: {
            success: true,
            rooms: @hotel.rooms.in_floor(params[:reservation][:floor]).each_with_object({}) {|room, hash|
              reservations = room.reservations.for_dates(room, params[:reservation][:start_date].to_date, params[:reservation][:end_date].to_date)
              hash[room.id] = {
                id: room.id,
                number: room.number,
                floor: room.floor,
                places: room.places,
                booked: reservations.pluck(:places).sum,
                reservations: reservations.each_with_object({}) {|reservation, hash| hash[reservation.id] = {
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
      else
        render json: {success: false, error: r.errors.full_messages.first}
      end
    else
      render json: {success: false, error: 'Invalid room'}
    end
  end

  def update
    reservation = @hotel.reservations.find_by_id(params[:id])
    room = reservation.room
    if reservation.update(reservation_params)
      if params[:from_list]
        render json: {
          success: true,
          reservations: @hotel.reservations.for_dates(@hotel, params[:start_date].try(:to_date), params[:end_date].try(:to_date)).map do |reservation|
            {id: reservation.id,
             name: reservation.name,
             room: Room.find_by_id(reservation.room_id).number,
             roomId: reservation.room_id,
             phone: reservation.phone,
             places: reservation.places,
             startDate: reservation.start_date.strftime('%d.%m.%Y'),
             endDate: reservation.end_date.strftime('%d.%m.%Y')}
          end
        }
      else
        render json: {
          success: true,
          reservations: room.reservations.for_dates(room, params[:date].try(:to_date).try(:at_beginning_of_month) || Date.today.at_beginning_of_month, params[:date].try(:to_date).try(:at_end_of_month) || Date.today.at_end_of_month).map do |reservation|
            {id: reservation.id,
             title: reservation.name,
             room: Room.find_by_id(reservation.room_id).number,
             roomId: reservation.room_id,
             phone: reservation.phone,
             places: reservation.places,
             start: reservation.start_date,
             end: reservation.end_date,
             allDay: false}
          end
        }
      end
    else
      render json: {success: false, error: reservation.errors.full_messages.first}
    end
  end

  def destroy
    reservation = @hotel.reservations.find_by_id(params[:id])
    room = reservation.room
    reservation.destroy
    if params[:from_calendar]
      render json: {
        success: true,
        reservations: room.reservations.for_dates(room, params[:date].try(:to_date).try(:at_beginning_of_month) || Date.today.at_beginning_of_month, params[:date].try(:to_date).try(:at_end_of_month) || Date.today.at_end_of_month).map do |reservation|
          {id: reservation.id,
           title: reservation.name,
           phone: reservation.phone,
           places: reservation.places,
           start: reservation.start_date,
           end: reservation.end_date,
           allDay: false}
        end
      }
    elsif params[:from_list]
      render json: {
        success: true,
        reservations: @hotel.reservations.for_dates(@hotel, params[:start_date].try(:to_date), params[:end_date].try(:to_date)).map do |reservation|
          {id: reservation.id,
           name: reservation.name,
           room: Room.find_by_id(reservation.room_id).number,
           roomId: reservation.room_id,
           phone: reservation.phone,
           places: reservation.places,
           startDate: reservation.start_date.strftime('%d.%m.%Y'),
           endDate: reservation.end_date.strftime('%d.%m.%Y')}
        end
      }
    else
      render json: {
        success: true,
        rooms: @hotel.rooms.in_floor(params[:floor]).each_with_object({}) {|room, hash|
          reservations = room.reservations.for_dates(room, params[:start_date].to_date, params[:end_date].to_date)
          hash[room.id] = {
            id: room.id,
            number: room.number,
            floor: room.floor,
            places: room.places,
            booked: reservations.pluck(:places).sum,
            reservations: reservations.each_with_object({}) {|reservation, hash| hash[reservation.id] = {
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
      rooms: @hotel.rooms.in_floor(params[:floor]).each_with_object({}) {|room, hash|
        reservations = room.reservations.for_dates(room, params[:start_date].to_date, params[:end_date].to_date)
        hash[room.id] = {
          id: room.id,
          number: room.number,
          floor: room.floor,
          places: room.places,
          booked: reservations.pluck(:places).sum,
          reservations: reservations.each_with_object({}) {|reservation, hash| hash[reservation.id] = {
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
      params.require(:reservation).permit(:name, :phone, :places, :start_date, :end_date, :hotel_id, :room_id)
    end

    def define_hotel
      @hotel = Hotel.friendly.find(params[:hotel_id])
    end
end
