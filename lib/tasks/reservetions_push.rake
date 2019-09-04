namespace :db do
  task :reservetions_push => [ :environment ] do
    require "uri"
    require "net/http"

    heroku_endpoint = 'https://dragobrat.herokuapp.com/receive'
    reservations = Hotel.find(20).reservations.map do |r|
      { roomId: r.room.number,
        name: r.name,
        phone: r.phone,
        places: r.places,
        description: r.description,
        deposit: r.deposit,
        startDate: r.start_date.strftime('%d.%m.%Y'),
        endDate: r.end_date.strftime('%d.%m.%Y')}
    end.to_json
    Net::HTTP.post_form(URI.parse(heroku_endpoint), {reservations: reservations})
  end
end