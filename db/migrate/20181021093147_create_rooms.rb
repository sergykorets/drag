class CreateRooms < ActiveRecord::Migration[5.1]
  def change
    create_table :rooms do |t|
      t.references :hotel, foreign_key: true
      t.integer :floor
      t.integer :number
      t.integer :places

      t.timestamps
    end
  end
end
