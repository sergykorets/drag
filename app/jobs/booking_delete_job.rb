class BookingDeleteJob < ApplicationJob
  queue_as :default

  def perform(reservation)
    BookingMailer.booking_delete_email(reservation).deliver
  end
end