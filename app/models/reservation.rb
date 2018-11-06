class Reservation < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :room
  belongs_to :hotel

  validates_presence_of :room, :name
  validates :places, numericality: { greater_than: 0 }
  validate :check_availability

  def self.for_dates(object, view_start, view_end)
    object.reservations.where('start_date < ? AND end_date > ?', view_end, view_start)
  end

  private

  def check_availability
    room = Room.find_by_id(room_id)
    room_places = room.places
    existed_reservations = room.reservations.where('start_date < ? AND end_date > ?', end_date, start_date)
    sum = existed_reservations.map {|reservation| reservation.places}.sum
    control_sum = id.nil? ? sum + places : start_date_changed? || end_date_changed? || room_id_changed? || places_changed? ? sum + places : sum
    if room_places < control_sum
      errors.add(:base, 'Цей номер в ці дати вже не помістить стільки гостей')
    end
  end
end