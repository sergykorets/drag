class GoogleReview < ApplicationRecord
	belongs_to :hotel
	has_one :reply, as: :repliable
end