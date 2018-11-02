class RoomsController < ApplicationController
  before_action :define_hotel

  def index
    @hotel_id = @hotel.id
    @rooms = @hotel.rooms.each_with_object({}) {|g, hash| hash[g.id] = {
      id: g.id,
      number: g.number,
      floor: g.floor,
      places: g.places}
    }
  end

  def calendar
    @hotel_id = @hotel.id
    @room = @hotel.rooms.find_by_id(params[:id]) || @hotel.rooms.first
    @rooms = @hotel.rooms.each_with_object({}) {|room, hash| hash[room.id] = {
      number: room.number
    }}
    @room = {
      id: @room.id,
      number: @room.number,
      floor: @room.floor,
      places: @room.places,
      reservations: @room.reservations.for_dates(@room, params[:date].try(:to_date).try(:at_beginning_of_month) || Date.today.at_beginning_of_month, params[:date].try(:to_date).try(:at_end_of_month) || Date.today.at_end_of_month).map do |reservation|
        { id: reservation.id,
          title: reservation.name,
          phone: reservation.phone,
          places: reservation.places,
          start: reservation.start_date,
          end: reservation.end_date,
          allDay: false}
      end
    }
    respond_to do |format|
      format.html { render :calendar }
      format.json {{room: @room }}
    end
  end

  def update
    @hotel.rooms.find_by_id(params[:id]).update(room_params)
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

  def room_params
    params.require(:room).permit(reservations_attributes: [:id, :name, :phone, :places])
  end

  def define_hotel
    @hotel = Hotel.friendly.find(params[:hotel_id])
  end
end
