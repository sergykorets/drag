class AddFieldsToHotels < ActiveRecord::Migration[5.1]
  def change
    add_column :hotels, :allow_booking, :boolean, default: false
    add_column :hotels, :auto_booking, :boolean, default: false
  end
end
