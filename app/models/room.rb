class Room < ApplicationRecord
  belongs_to :hotel
  has_many :reservations

  validates_presence_of :number, :floor, :places

  accepts_nested_attributes_for :reservations

  scope :in_floor, -> (floor) {where(floor: floor)}
end
