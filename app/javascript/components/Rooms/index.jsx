import React, {Fragment} from 'react';
import {NotificationContainer, NotificationManager} from 'react-notifications';

export default class Rooms extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hotelId: this.props.hotelId,
      allowBooking: this.props.allowBooking,
      autoBooking: this.props.autoBooking,
      rooms: this.props.rooms,
      flash: this.props.flash
    };
  }

  componentDidMount() {
    if (this.state.flash) {
      NotificationManager.error(this.state.flash, 'Неможливо перейти на сторінку')
    }
  }

  handleRoomChange = (field, i, value) => {
    this.setState({
      rooms: {
        ...this.state.rooms,
        [i]: {
          ...this.state.rooms[i],
          [field]: value
        }
      }
    })
  }

  addRoom = () => {
    this.setState({
      rooms: {
        ...this.state.rooms,
        [(+ new Date())]: {number: '', floor: '', places: ''}
      }
    })
  }

  deleteRoom = (i) => {
      if (this.state.rooms[i].id) {
        if (confirm('Видалити даний номер?')) {
          $.ajax({
            url: `/hotels/${this.state.hotelId}/rooms/${i}.json`,
            type: 'DELETE'
          }).then((resp) => {
            if (resp.success) {
              this.setState({rooms: resp.rooms});
              NotificationManager.success('Номер видалено')
            } else {
              resp.errors.map((error, index) => NotificationManager.error(error, 'Неможливо видалити'))
            }
          });
        }
      } else {
        let items = this.state.rooms
        delete items[i]
        this.setState({rooms: items});
      }
  }

  handleSubmit = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}.json`,
      type: 'PATCH',
      data: {
        hotel: {
          id: this.state.hotelId,
          allow_booking: this.state.allowBooking,
          auto_booking: this.state.autoBooking,
          rooms_attributes: this.state.rooms
        }
      }
    }).then((resp) => {
      if (resp.success) {
        NotificationManager.success('Зміни збережено')
      } else {
        resp.errors.map((error, index) => NotificationManager.error(error, 'Неможливо створити'))
      }
    });
  }

  handleInputChange = (field, value) => {
    this.setState({[field]: value})
  }

  render() {
    return (
      <div className="container page-wraper">
        <NotificationContainer/>
        <h3 className='text-center'>Створення номерів в готелі</h3>
        <div className='form-group'>
          <i className='fa fa-plus btn btn-info' onClick={this.addRoom}> Додати номер</i>
        </div>
        <hr/>
        <div className='row'>
          { Object.keys(this.state.rooms).map((i) => {
            const room = this.state.rooms[i]
            if (!room._destroy) {
              return (
                <div key={i} className="col-lg-3 mb-4">
                  <div className='room'>
                    <i className='fa fa-trash-o float-right' onClick={() => this.deleteRoom(i)} />
                    <div className='form-group'>
                      <label>Номер</label>
                      <input type="number" min={1} className='form-control' value={room.number} onChange={(e) => this.handleRoomChange('number', i, e.target.value)} />
                    </div>
                    <div className='form-group'>
                      <label>Поверх</label>
                      <input type="number" min={1} className='form-control' value={room.floor} onChange={(e) => this.handleRoomChange('floor', i, e.target.value)} />
                    </div>
                    <div className='form-group'>
                      <label>Кількість місць</label>
                      <input type="number" min={1} className='form-control' value={room.places} onChange={(e) => this.handleRoomChange('places', i, e.target.value)} />
                    </div>
                    <div className='form-group'>
                      <div className='custom-checkbox'>
                        <input type='checkbox' id="big_bed" onChange={(e) => this.handleRoomChange('big_bed', i, !this.state.rooms[i].big_bed)} checked={this.state.rooms[i].big_bed} />
                        <label htmlFor="big_bed">Двоспальне ліжко</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}})}
        </div>
        <hr/>
        <div className='form-group'>
          <div className='custom-checkbox'>
            <input type='checkbox' id="allow_booking" onChange={() => this.handleInputChange('allowBooking', !this.state.allowBooking)} checked={this.state.allowBooking} />
            <label htmlFor="allow_booking">Дозволити бронювати онлайн</label>
          </div>
        </div>
        <div className='form-group'>
          <div className='custom-checkbox'>
            <input type='checkbox' disabled={!this.state.allowBooking} id="auto_booking" onChange={() => this.handleInputChange('autoBooking', !this.state.autoBooking)} checked={this.state.allowBooking && this.state.autoBooking} />
            <label htmlFor="auto_booking">Дозволити автоматичне бронювання</label>
          </div>
        </div>
        <hr/>
        <div className='form-group'>
          <button className='btn btn-block btn-dark' onClick={this.handleSubmit}>Зберегти</button>
        </div>
      </div>
    );
  }
}
