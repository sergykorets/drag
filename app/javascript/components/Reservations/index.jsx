import React, {Fragment} from 'react';
import moment from 'moment'
import RangePicker from 'bootstrap-daterangepicker';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Rooms from "../Rooms";

export default class Reservations extends React.Component {
  constructor(props) {
    super(props);

    moment.locale('uk');

    this.state = {
      hotelId: this.props.hotelId,
      floors: this.props.floors,
      rooms: this.props.rooms,
      startDate: moment(new Date).format('DD.MM.YYYY'),
      endDate: moment(new Date).add(1, 'days').format('DD.MM.YYYY'),
      floor: 1,
      name: '',
      phone: '',
      places: 1,
      createModal: false,
      editModal: false,
      selectedRoomId: ''
    }
  }

  handleDateChange = (event, picker) => {
    $.ajax({
      url: `/hotels/${this.props.hotelId}/reservations/dates.json`,
      type: 'GET',
      data: {
        floor: this.state.floor,
        start_date: picker.startDate.format('DD.MM.YYYY'),
        end_date: picker.endDate.format('DD.MM.YYYY')
      },
      success: (resp) => {
        this.setState({startDate: picker.startDate.format('DD.MM.YYYY'), endDate: picker.endDate.format('DD.MM.YYYY'), rooms: resp.rooms})
      }
    });
  }

  handleInputChange = (field, value) => {
    this.setState({[field]: value})
  }

  handleModal = (modal, id) => {
    this.setState({
      [modal]: !this.state[modal],
      selectedRoomId: id
    });
  }

  handleFloorChange = (floor) => {
    $.ajax({
      url: `/hotels/${this.props.hotelId}/reservations/dates.json`,
      type: 'GET',
      data: {
        floor: floor,
        start_date: this.state.startDate,
        end_date: this.state.endDate
      },
      success: (resp) => {
        this.setState({floor: floor, rooms: resp.rooms})
      }
    });
  }

  handleSubmitReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations.json`,
      type: 'POST',
      data: {
        reservation: {
          hotel_id: this.state.hotelId,
          floor: this.state.floor,
          room_id: this.state.selectedRoomId,
          name: this.state.name,
          phone: this.state.phone,
          places: this.state.places,
          start_date: this.state.startDate,
          end_date: this.state.endDate
        }
      }
    }).then((resp) => {
      if (resp.success) {
        this.setState({rooms: resp.rooms, createModal: false, name: '', phone: '', places: 1})
      } else {
        NotificationManager.error(resp.error, 'Неможливо створити');
      }
    });
  }

  roomColor = (id) => {
    const room = this.state.rooms[id]
    const reservations = Object.keys(room.reservations)
    if (reservations.length > 0) {
      const places = reservations.map((reservation, i) => room.reservations[reservation].places).reduce((a, b) => a + b, 0)
      if (places < room.places) {
        return 'yellow'
      } else {
        return 'red'
      }
    } else {
      return 'green'
    }
  }

  handleReservationChange = (id, field, value) => {
    this.setState({
      ...this.state,
      rooms: {
        ...this.state.rooms,
        [this.state.selectedRoomId]: {
          ...this.state.rooms[this.state.selectedRoomId],
          reservations: {
            ...this.state.rooms[this.state.selectedRoomId].reservations,
            [id]: {
              ...this.state.rooms[this.state.selectedRoomId].reservations[id],
              [field]: value
            }
          }
        }
      }
    })
  }

  handleSubmitEditReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/rooms/${this.state.selectedRoomId}.json?floor=${this.state.floor}`,
      type: 'PATCH',
      data: {
        room: {
          reservations_attributes: this.state.rooms[this.state.selectedRoomId].reservations
        },
        start_date: this.state.startDate,
        end_date: this.state.endDate
      }
    }).then((resp) => {
      if (resp.success) {
        this.setState({rooms: resp.rooms, editModal: false})
      } else {
        NotificationManager.error(resp.error, 'Неможливо створити');
      }
    });
  }

  deleteReservation = (id) => {
    if (confirm('Видалити дане бронювання?')) {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/reservations/${id}.json`,
        type: 'DELETE',
        data: {
          floor: this.state.floor,
          start_date: this.state.startDate,
          end_date: this.state.endDate
        }
      }).then((resp) => {
        this.setState({rooms: resp.rooms, editModal: false})
      });
    }
  }

  render() {
    console.log('Reservations', this.state)
    return (
      <div className="container reservations">
        <NotificationContainer/>
        <div className='row'>
          <div className='col-lg-4'>
            <DateRangePicker onApply={this.handleDateChange} startDate={this.state.startDate} endDate={this.state.endDate}>
              <div className='row'>
                <div className='col-lg-6'>
                  <label>Початок заїзду</label>
                  <input type="text" className='form-control' value={this.state.startDate}/>
                </div>
                <div className='col-lg-6'>
                  <label>Кінець заїзду</label>
                  <input type="text" className='form-control' value={this.state.endDate}/>
                </div>
              </div>
            </DateRangePicker>
          </div>
          <div className='col-lg-2'>
            <label>Поверх</label>
            <select className='form-control' value={this.state.floor} onChange={(e) => this.handleFloorChange(e.target.value)}>
              { [...Array(parseInt(this.state.floors, 10))].map((e,i) =>
                <option key={i} value={i+1}>Поверх {i+1}</option>
              )}
            </select>
          </div>
        </div>
        <hr/>
        { Object.keys(this.state.rooms).length > 0 ?
          <div className='row'>
            { Object.keys(this.state.rooms).map((id) => {
              return (
                <div key={id} className='col-lg-12 room'>
                  <h4 className={'float-right ' + this.roomColor(id)}>
                    <strong>
                      { this.roomColor(id) === 'red' && 'Заброньований'}
                      { this.roomColor(id) === 'yellow' && 'Частково заброньований'}
                      { this.roomColor(id) === 'green' && 'Вільний'}
                    </strong>
                  </h4>
                  <h3><b>Номер {this.state.rooms[id].number}</b></h3>
                  <p>Кількість місць: {this.state.rooms[id].places}</p>
                  { this.roomColor(id) === 'yellow' && <p>Кількість заброньованих місць: {this.state.rooms[id].booked}</p>}
                  { this.roomColor(id) != 'red' &&
                    <button className='btn-dark' onClick={() => this.handleModal('createModal', id)}>Створити резервування</button>}
                  { this.roomColor(id) != 'green' &&
                    <button className='btn-info' onClick={() => this.handleModal('editModal', id)}>Редагувати бронь</button>}
                </div>
              )})}
          </div>
          :
          <Rooms rooms={this.state.rooms}/>}
        { this.state.createModal &&
          <Modal isOpen={this.state.createModal} toggle={() => this.handleModal('createModal', '')}>
            <div className='reservation-form'>
              <h6 className='text-center'>Створення нового бронювання {`від ${this.state.startDate} до ${this.state.endDate}`}</h6>
              <label>Ім'я</label>
              <input type='text' className='form-control' value={this.state.name} onChange={(e) => this.handleInputChange('name', e.target.value)} />
              <label>Телефон</label>
              <input type='text' className='form-control' value={this.state.phone} onChange={(e) => this.handleInputChange('phone', e.target.value)} />
              <label>Кількість місць</label>
              <select className='form-control' value={this.state.places} onChange={(e) => this.handleInputChange('places', e.target.value)}>
                { [...Array(parseInt(this.state.rooms[this.state.selectedRoomId].places, 10))].map((e,i) =>
                  <option key={i} value={i+1}>{i+1}</option>
                )}
              </select>
              <button className='btn btn-block reservation-btn' onClick={this.handleSubmitReservation}>Створити</button>
            </div>
          </Modal>}
        { this.state.editModal &&
          <Modal isOpen={this.state.editModal} toggle={() => this.handleModal('editModal', '')}>
            <div className='reservation-form-top'>
              <h5 className='text-center'>Номер {this.state.rooms[this.state.selectedRoomId].number}</h5>
              <h6 className='text-center'>Поточні бронювання {`від ${this.state.startDate} до ${this.state.endDate}`}</h6>
              <hr/>
            </div>
            { Object.keys(this.state.rooms[this.state.selectedRoomId].reservations).map((r, i) => {
              const reservation = this.state.rooms[this.state.selectedRoomId].reservations[r]
              return (
                <div className='reservation-form' key={i}>
                  <i className='fa fa-trash-o float-right' onClick={() => this.deleteReservation(r)} />
                  <label>Ім'я</label>
                  <input type='text' className='form-control' value={reservation.name} onChange={(e) => this.handleReservationChange(r, 'name', e.target.value)} />
                  <label>Телефон</label>
                  <input type='text' className='form-control' value={reservation.phone} onChange={(e) => this.handleReservationChange(r, 'phone', e.target.value)} />
                  <label>Кількість місць</label>
                  <select className='form-control' value={reservation.places} onChange={(e) => this.handleReservationChange(r, 'places', e.target.value)}>
                    { [...Array(parseInt(this.state.rooms[this.state.selectedRoomId].places, 10))].map((e,i) =>
                      <option key={i} value={i+1}>{i+1}</option>
                    )}
                  </select>
                </div>
              )})}
              <div className='reservation-btn-div'>
                <hr/>
                <button className='btn btn-block reservation-btn' onClick={this.handleSubmitEditReservation}>Редагувати</button>
              </div>
          </Modal>}
      </div>
    );
  }
}
