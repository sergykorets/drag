class CreateReservations < ActiveRecord::Migration[5.1]
  def change
    create_table :reservations do |t|
      t.references :user, foreign_key: true
      t.string :name
      t.string :phone
      t.references :room, foreign_key: true
      t.references :hotel, foreign_key: true
      t.date :start_date
      t.date :end_date
      t.integer :places
      t.timestamps
    end
  end
end
