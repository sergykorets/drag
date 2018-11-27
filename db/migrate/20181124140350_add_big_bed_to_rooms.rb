class AddBigBedToRooms < ActiveRecord::Migration[5.1]
  def change
    add_column :rooms, :big_bed, :boolean, default: false
  end
end
