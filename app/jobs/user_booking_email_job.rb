class UserBookingEmailJob < ApplicationJob
  queue_as :default

  def perform(reservation)
    BookingMailer.user_booking_email(reservation).deliver
  end
end
