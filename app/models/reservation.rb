class Reservation < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :room
  belongs_to :hotel

  validates_presence_of :room

  scope :for_today, -> {where(start_date: Date.today)}

  def self.for_dates(object, view_start, view_end)
    object.reservations.where('start_date < ? AND end_date > ?', view_end, view_start)
  end
end
