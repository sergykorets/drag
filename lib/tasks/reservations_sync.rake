namespace :db do
  task :reservations_sync => [ :environment ] do
    require "uri"
    require "net/http"

    puts 'Reservation sync started'

    hotel = Hotel.find(20)
    heroku_receive_endpoint = 'https://dragobrat.herokuapp.com/receive'
    heroku_request_endpoint = URI.parse('https://dragobrat.herokuapp.com/request_reservations')
    http = Net::HTTP.new(heroku_request_endpoint.host, heroku_request_endpoint.port)
    http.use_ssl = true
    heroku_request_endpoint.query = URI.encode_www_form({hotel: 'Піпаш', email: 'vasilpipash@gmail.com'})
    response = http.get(heroku_request_endpoint.request_uri)
    JSON.parse(response.body)['reservations'].each do |r|
      room_id = hotel.rooms.find_by_number(r['roomId']).try(:id)
      reservation = {room_id: room_id, name: r['name'], phone: r['phone'], places: r['places'],
                     description: r['description'], deposit: r['deposit'],
                     start_date: r['startDate'], end_date: r['endDate'], status: r['status']}
      next if hotel.reservations.exists?(reservation)
      hotel.reservations.create(reservation)
    end
    sleep 5
    reservations = hotel.reservations.map do |r|
      { roomId: r.room.number,
        name: r.name,
        phone: r.phone,
        places: r.places,
        description: r.description,
        deposit: r.deposit,
        status: r.status,
        startDate: r.start_date.strftime('%d.%m.%Y'),
        endDate: r.end_date.strftime('%d.%m.%Y')}
    end.to_json
    Net::HTTP.post_form(URI.parse(heroku_receive_endpoint), {reservations: reservations, hotel: 'Піпаш', email: 'vasilpipash@gmail.com'})
    puts 'Reservation sync ended'
  end
end