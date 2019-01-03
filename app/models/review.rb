class Review < ApplicationRecord
	belongs_to :hotel
	belongs_to :user
	has_one :reply, as: :repliable

	validates_presence_of :rating, :user_id, :hotel_id
	validates_uniqueness_of :user_id, scope: :hotel_id
end