namespace :db do
  task :reservstions_sync => [ :environment ] do
    require "uri"
    require "net/http"

    hotel = Hotel.find(20)
    heroku_receive_endpoint = 'https://dragobrat.herokuapp.com/receive'
    heroku_request_endpoint = URI.parse('https://dragobrat.herokuapp.com/request_reservations')
    http = Net::HTTP.new(heroku_request_endpoint.host, heroku_request_endpoint.port)
    http.use_ssl = true
    heroku_request_endpoint.query = URI.encode_www_form({hotel: 'Піпаш', email: 'vasilpipash@gmail.com'})
    response = http.get(heroku_request_endpoint.request_uri)
    response['reservations'].each do |r|
      hotel.reservations.create(room_id: r['roomId'], name: r['name'], phone: r['phone'], places: r['places'],
                                         description: r['description'], deposit: r['deposit'],
                                         start_date: r['startDate'], end_date: r['endDate'], status: r['status'])
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
  end
end