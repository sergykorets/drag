class AddFieldsToReservation < ActiveRecord::Migration[5.1]
  def change
    add_column :reservations, :status, :integer, default: 0
    add_column :reservations, :description, :text
    add_column :reservations, :deposit, :integer
  end
end