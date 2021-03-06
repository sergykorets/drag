class Reservation < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :room, optional: true
  belongs_to :hotel
  belongs_to :ratrak, optional: true

  enum status: [:pending, :approved, :declined]

  validates_presence_of :name, :start_date, :end_date
  validates_presence_of :room, if: -> {self.ratrak_id.nil?}
  validates :places, numericality: { greater_than: 0 }
  validate :check_availability

  before_destroy :send_mail_to_user

  scope :for_rooms, -> {where(ratrak_id: nil)}

  def self.for_dates(object, view_start, view_end)
    object.reservations.approved.where('start_date < ? AND end_date > ?', view_end, view_start)
  end

  def booked_dates
    blocked_dates = []
    date = self.start_date
    room = self.room
    (date.beginning_of_month..date.end_of_month).each do |day|
      reserved = room.reservations.approved.where('start_date < ? AND end_date > ? AND id NOT IN (?)', day.tomorrow, day, [self.id]).map {|r| r.places}.sum
      blocked_dates << day if reserved >= room.places
    end
    blocked_dates
  end

  private

  def check_availability
    unless ratrak_id
      room = Room.find_by_id(room_id)
      room_places = room.places
      existed = room.reservations.approved.where('start_date < ? AND end_date > ?', end_date, start_date)
      sum = existed.map {|reservation| reservation.places}.sum
      control_sum = if id.nil? || (start_date_changed? && !(existed.count == 1 && existed.first.id == id)) ||
        (end_date_changed? && !(existed.count == 1 && existed.first.id == id)) || room_id_changed? || (status_changed? && status == 'approved')
        sum + places
      elsif places_changed? && places_was < places
        existed.select {|r| r.id != id}.map {|reservation| reservation.places}.sum + places
      else
        sum
      end
      if room_places < control_sum
        errors.add(:base, 'Цей номер в ці дати вже не помістить стільки гостей')
      else
        BookingResponseJob.perform_later(self, status) if user_id && status_changed? && !new_record?
      end
    end
  end

  def send_mail_to_user
    BookingDeleteJob.perform_later(self) if user_id
  end
end