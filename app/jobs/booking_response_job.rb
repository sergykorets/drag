class BookingResponseJob < ApplicationJob
  queue_as :default

  def perform(reservation, status)
    BookingMailer.booking_response_email(reservation, status).deliver
  end
end
