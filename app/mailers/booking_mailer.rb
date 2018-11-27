class BookingMailer < ApplicationMailer
  default from: 'dragobrat.net@gmail.com'

  def user_booking_email(reservation)
    @reservation = reservation
    @room = reservation.room
    @auto_booked = @room.hotel.auto_booking
    if @auto_booked
      mail(to: reservation.user.email, subject: "Готель заброньовано (Номер #{@room.number})")
    else
      mail(to: reservation.user.email, subject: "Запит на бронювання готеля надіслано (Номер #{@room.number})")
    end
  end

  def booking_email_for_hotel(reservation)
    @reservation = reservation
    @room = reservation.room
    @auto_booked = @room.hotel.auto_booking
    if @auto_booked
      mail(to: @room.hotel.user.email, subject: "Номер #{@room.number} було заброньовано (#{reservation.start_date.strftime('%d.%m.%Y')} - #{reservation.end_date.strftime('%d.%m.%Y')})")
    else
      mail(to: @room.hotel.user.email, subject: "Новий запит на бронювання (#{reservation.start_date.strftime('%d.%m.%Y')} - #{reservation.end_date.strftime('%d.%m.%Y')})")
    end
  end

  def booking_response_email(reservation, status)
    @room = reservation.room
    @reservation = reservation
    @approved = status == 'approved'
    if @approved
      mail(to: reservation.user.email, subject: "Запит підтверджено")
    else
      mail(to: reservation.user.email, subject: "Запит відхилено")
    end
  end

  def booking_delete_email(reservation)
    @reservation = reservation
    @room = reservation.room
    mail(to: reservation.user.email, subject: "Бронювання готелю було видалено")
  end
end