class RoomsController < ApplicationController
  layout 'hotel_admin'
  before_action :authenticate_user!
  before_action :define_hotel
  before_action :check_rooms, only: [:calendar, :reservation_list, :pending_reservations, :chess]

  def index
    @hotel_id = @hotel.id
    @rooms = @hotel.rooms.each_with_object({}) {|g, hash| hash[g.id] = {
      id: g.id,
      number: g.number,
      floor: g.floor,
      places: g.places,
      big_bed: g.big_bed}
    }
  end

  def calendar
    @hotel_id = @hotel.id
    @room = @hotel.rooms.find_by_id(params[:id]) || @hotel.rooms.first
    @rooms = @hotel.rooms.each_with_object({}) {|room, hash| hash[room.id] = {
      number: room.number,
      places: room.places,
      floor: room.floor,
      bigBed: room.big_bed
    }}
    @room = {
      id: @room.id,
      number: @room.number,
      floor: @room.floor,
      places: @room.places,
      bigBed: @room.big_bed,
      reservations: @room.reservations.approved.for_dates(@room, params[:date].try(:to_date).try(:at_beginning_of_month) || Date.today.at_beginning_of_month, params[:date].try(:to_date).try(:at_end_of_month) || Date.today.at_end_of_month).map do |reservation|
        { id: reservation.id,
          title: reservation.name,
          phone: reservation.phone,
          places: reservation.places,
          description: reservation.description,
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

  def reservation_list
    @hotel_id = @hotel.id
    @reservations = @hotel.reservations.approved
                      .for_dates(@hotel, params[:start_date].try(:to_date) || Date.today, params[:end_date].try(:to_date) || Date.tomorrow)
                      .order(created_at: :desc)
    @rooms = @hotel.rooms.each_with_object({}) {|room, hash| hash[room.id] = {
      number: room.number,
      places: room.places,
      floor: room.floor,
      bigBed: room.big_bed
    }}
    @reservations_paginated = @reservations.page(params[:page] || 1).per(10).each_with_object({}) {|reservation, hash| hash[reservation.id] = {
      id: reservation.id,
      room: Room.find_by_id(reservation.room_id).number,
      roomId: reservation.room_id,
      name: reservation.name,
      phone: reservation.phone,
      places: reservation.places,
      description: reservation.description,
      deposit: reservation.deposit,
      startDate: reservation.start_date.strftime('%d.%m.%Y'),
      endDate: reservation.end_date.strftime('%d.%m.%Y')}
    }
    respond_to do |format|
      format.html { render :reservation_list }
      format.json {{reservations: @reservations_paginated, totalReservationsCount: @reservations.count }}
    end
  end

  def chess
    @hotel_id = @hotel.id
    @rooms = @hotel.rooms.order(:number).map {|room| {id: room.id, title: "Номер #{room.number}"}}
    @reservations = @hotel.reservations.approved.map { |reservation|
      { id: reservation.id,
        group: reservation.room_id,
        title: reservation.name,
        start_time: (reservation.start_date.to_datetime + Time.parse("12:00").seconds_since_midnight.seconds).strftime('%Y-%m-%d %H:%M'),
        end_time: (reservation.end_date.to_datetime + Time.parse("12:00").seconds_since_midnight.seconds).strftime('%Y-%m-%d %H:%M'),}
    }
    respond_to do |format|
      format.html { render :chess }
      format.json {{reservations: @reservations}}
    end
  end

  def pending_reservations
    @hotel_id = @hotel.id
    @reservations = @hotel.reservations.pending.order(created_at: :desc)
    @rooms = @hotel.rooms.each_with_object({}) {|room, hash| hash[room.id] = {
      number: room.number,
      places: room.places,
      floor: room.floor,
      bigBed: room.big_bed
    }}
    @reservations_paginated = @reservations.page(params[:page] || 1).per(10).each_with_object({}) {|reservation, hash| hash[reservation.id] = {
      id: reservation.id,
      room: Room.find_by_id(reservation.room_id).number,
      roomId: reservation.room_id,
      name: reservation.name,
      phone: reservation.phone,
      places: reservation.places,
      description: reservation.description,
      created: reservation.created_at.in_time_zone('Kyiv').strftime('%d.%m.%Y %H:%M'),
      startDate: reservation.start_date.strftime('%d.%m.%Y'),
      endDate: reservation.end_date.strftime('%d.%m.%Y')}
    }
    respond_to do |format|
      format.html { render :pending_reservations }
      format.json {{reservations: @reservations_paginated, totalReservationsCount: @reservations.count }}
    end
  end

  def update
    if @hotel.rooms.find_by_id(params[:id]).update(room_params)
      rooms = params[:floor] != 'all' ? @hotel.rooms.in_floor(params[:floor]) : @hotel.rooms
      render json: {
        success: true,
        rooms: rooms.each_with_object({}) {|room, hash|
          reservations = room.reservations.approved.for_dates(room, params[:start_date].to_date, params[:end_date].to_date)
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
              description: reservation.description,
              startDate: reservation.start_date.strftime('%d.%m.%Y'),
              endDate: reservation.end_date.strftime('%d.%m.%Y')}
            }
          }
      }}
    else
      render json: {success: false}
    end
  end

  def destroy
    room = @hotel.rooms.find_by_id(params[:id])
    if room.destroy
      render json: { success: true, rooms: @hotel.rooms.each_with_object({}) {|g, hash| hash[g.id] = {
        id: g.id,
        number: g.number,
        floor: g.floor,
        places: g.places}
      }}
    else
      render json: {success: false, errors: @hotel.errors.full_messages}
    end
  end

  private

  def check_rooms
    redirect_to hotel_rooms_path(reason: 'Спершу потрібно створити номери в готелі') if @hotel.rooms.empty?
  end

  def room_params
    params.require(:room).permit(reservations_attributes: [:id, :name, :phone, :description, :places])
  end

  def define_hotel
    @hotel = if current_user.admin
      Hotel.friendly.find(params[:hotel_id])
    else
      current_user.hotels.friendly.find(params[:hotel_id])
    end
  end
end
