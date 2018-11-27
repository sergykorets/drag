class BookingEmailForHotelJob < ApplicationJob
  queue_as :default

  def perform(reservation)
    BookingMailer.booking_email_for_hotel(reservation).deliver
  end
end