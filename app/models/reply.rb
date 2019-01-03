class Reply < ApplicationRecord
  belongs_to :repliable, polymorphic: true
  belongs_to :user

  validates_presence_of :user_id, :body
end