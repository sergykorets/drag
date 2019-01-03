# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20190103110543) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "friendly_id_slugs", id: :serial, force: :cascade do |t|
    t.string "slug", null: false
    t.integer "sluggable_id", null: false
    t.string "sluggable_type", limit: 50
    t.string "scope"
    t.datetime "created_at"
    t.index ["slug", "sluggable_type", "scope"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope", unique: true
    t.index ["slug", "sluggable_type"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type"
    t.index ["sluggable_id"], name: "index_friendly_id_slugs_on_sluggable_id"
    t.index ["sluggable_type"], name: "index_friendly_id_slugs_on_sluggable_type"
  end

  create_table "google_photos", id: :serial, force: :cascade do |t|
    t.integer "hotel_id"
    t.string "photo_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "deleted", default: false
    t.string "name"
    t.index ["hotel_id"], name: "index_google_photos_on_hotel_id"
  end

  create_table "google_reviews", id: :serial, force: :cascade do |t|
    t.integer "hotel_id"
    t.string "author_name"
    t.string "profile_photo_url"
    t.integer "rating"
    t.string "relative_time_description"
    t.text "text"
    t.integer "time"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "hotels", id: :serial, force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.integer "price"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "google_id"
    t.string "site"
    t.string "reference"
    t.string "google_rating"
    t.string "location"
    t.string "site_rating"
    t.string "average_rating"
    t.integer "user_id"
    t.integer "main_photo_id"
    t.integer "hotel_type", default: 0
    t.string "main_photo_type"
    t.string "booking_link"
    t.decimal "latitude"
    t.decimal "longitude"
    t.string "slug"
    t.integer "position", default: 200
    t.boolean "sauna", default: false
    t.boolean "chan", default: false
    t.boolean "disco", default: false
    t.boolean "allow_booking", default: false
    t.boolean "auto_booking", default: false
    t.index ["user_id"], name: "index_hotels_on_user_id"
  end

  create_table "nearby_hotels", force: :cascade do |t|
    t.integer "hotel_id"
    t.integer "nearby_hotel_id"
  end

  create_table "phones", id: :serial, force: :cascade do |t|
    t.integer "hotel_id"
    t.string "phone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["hotel_id"], name: "index_phones_on_hotel_id"
  end

  create_table "photos", id: :serial, force: :cascade do |t|
    t.integer "hotel_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "picture_file_name"
    t.string "picture_content_type"
    t.integer "picture_file_size"
    t.datetime "picture_updated_at"
    t.string "photo_url"
    t.string "name"
  end

  create_table "places", id: :serial, force: :cascade do |t|
    t.integer "number"
    t.integer "user_id"
  end

  create_table "replies", force: :cascade do |t|
    t.integer "user_id"
    t.text "body"
    t.integer "repliable_id"
    t.string "repliable_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "reservations", force: :cascade do |t|
    t.bigint "user_id"
    t.string "name"
    t.string "phone"
    t.bigint "room_id"
    t.bigint "hotel_id"
    t.date "start_date"
    t.date "end_date"
    t.integer "places"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "status", default: 0
    t.text "description"
    t.integer "deposit"
    t.index ["hotel_id"], name: "index_reservations_on_hotel_id"
    t.index ["room_id"], name: "index_reservations_on_room_id"
    t.index ["user_id"], name: "index_reservations_on_user_id"
  end

  create_table "reviews", id: :serial, force: :cascade do |t|
    t.integer "rating"
    t.text "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.integer "hotel_id"
  end

  create_table "rooms", force: :cascade do |t|
    t.bigint "hotel_id"
    t.integer "floor"
    t.integer "number"
    t.integer "places"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "big_bed", default: false
    t.index ["hotel_id"], name: "index_rooms_on_hotel_id"
  end

  create_table "suggests", force: :cascade do |t|
    t.text "body"
    t.string "email"
    t.integer "user_id"
    t.integer "hotel_id"
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.inet "current_sign_in_ip"
    t.inet "last_sign_in_ip"
    t.string "role"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.string "avatar_file_name"
    t.string "avatar_content_type"
    t.integer "avatar_file_size"
    t.datetime "avatar_updated_at"
    t.string "provider"
    t.string "uid"
    t.string "remote_avatar_url"
    t.boolean "admin", default: false
    t.datetime "deleted_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "reservations", "hotels"
  add_foreign_key "reservations", "rooms"
  add_foreign_key "reservations", "users"
  add_foreign_key "rooms", "hotels"
end
