import React, {Fragment} from 'react';
import interactjs from 'interactjs';
import moment from 'moment';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Timeline from 'react-calendar-timeline'
import AirBnbPicker from "../common/AirBnbPicker";

export default class Chess extends React.Component {
  constructor(props) {
    super(props);

    moment.locale('uk');

    this.state = {
      hotelId: this.props.hotelId,
      reservations: this.props.reservations,
      rooms: this.props.rooms,
      hotelRooms: this.props.hotelRooms,
      editModal: false,
      createModal: false,
      selectedReservation: {},
      visibleTimeStart: moment().add(-1, 'day').valueOf(),
      visibleTimeEnd: moment().add(30, 'day').valueOf(),
      newReservation: {
        name: '',
        phone: '',
        deposit: '',
        description: '',
        places: this.props.hotelRooms[Object.keys(this.props.hotelRooms)[0]].places,
        startDate: null,
        endDate: null,
        roomId: Object.keys(this.props.hotelRooms)[0]
      },
      bookedDates: []
    }
  }

  convertedDates = (reservations) => {
    let convertedReservations = reservations.map((reservation) => {
      return Object.assign(reservation, {start_time: new Date(reservation.start_time)})
    })
    const convertedReservations2 = convertedReservations.map((reservation) => {
      return Object.assign(reservation, {end_time: new Date(reservation.end_time)})
    })
    return convertedReservations2
  }

  groupRenderer = ({ group }) => {
    return (
      <div className="custom-group">
        <a href={`/hotels/${this.state.hotelId}/rooms/calendar?id=${group.id}`} className="title">{group.title}</a>
      </div>
    )
  }

  handleModal = (modal, itemId) => {
    if (itemId) {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/reservations/${itemId}`,
        type: 'GET'
      }).then((resp) =>
        this.setState({
          ...this.state,
          [modal]: !this.state[modal],
          selectedReservation: resp.reservation,
          bookedDates: resp.bookedDates
        })
      )
    } else {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/booked_dates.json?date=${this.state.newReservation.startDate || new Date()}&room_id=${this.state.newReservation.roomId}`,
        type: 'GET'
      }).then((resp) =>
        this.setState({
          ...this.state,
          bookedDates: resp.blockedDates,
          [modal]: !this.state[modal],
        })
      )
    }
  }

  handleReservationDateChange = ({startDate, endDate}) => {
    this.setState({
      ...this.state,
      selectedReservation: {
        ...this.state.selectedReservation,
        startDate: startDate ? startDate.format('DD.MM.YYYY') : null,
        endDate: endDate ? endDate.format('DD.MM.YYYY') : null
      }
    })
  }

  handleReservationChange = (field, value) => {
    if (field === 'roomId') {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/booked_dates.json?date=${this.state.selectedReservation.startDate}&room_id=${value}&reservation_id=${this.state.selectedReservation.id}`,
        type: 'GET'
      }).then((resp) => this.setState({
        ...this.state,
        blockedDates: resp.blockedDates,
        selectedReservation: {
          ...this.state.selectedReservation,
          [field]: value
        }
      }))
    } else {
      this.setState({
        ...this.state,
        selectedReservation: {
          ...this.state.selectedReservation,
          [field]: value
        }
      })
    }
  }

  getBlockedDates = (date) => {
    if (this.state.editModal) {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/booked_dates.json?date=${date.format('YYYY-MM-DD')}&room_id=${this.state.selectedReservation.roomId}&reservation_id=${this.state.editModal ? this.state.selectedReservation.id : ''}`,
        type: 'GET'
      }).then((resp) => this.setState({bookedDates: resp.blockedDates}))
    } else {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/booked_dates.json?date=${date.format('YYYY-MM-DD')}&room_id=${this.state.newReservation.roomId}`,
        type: 'GET'
      }).then((resp) => this.setState({bookedDates: resp.blockedDates}))
    }
  }

  convertedBookedDates = () => {
    const dates = this.state.bookedDates.map((date) => {
      return moment(date)
    })
    return dates
  }

  handleSubmitEditReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations/${this.state.selectedReservation.id}.json`,
      type: 'PATCH',
      data: {
        from_chess: true,
        reservation: {
          room_id: this.state.selectedReservation.roomId,
          name: this.state.selectedReservation.name,
          phone: this.state.selectedReservation.phone,
          places: this.state.selectedReservation.places,
          deposit: this.state.selectedReservation.deposit,
          start_date: this.state.selectedReservation.startDate,
          end_date: this.state.selectedReservation.endDate,
          description: this.state.selectedReservation.description,
          deposit: this.state.selectedReservation.deposit
        }
      }
    }).then((resp) => {
      if (resp.success) {
        NotificationManager.success('Бронювання оновлено');
        this.setState({reservations: resp.reservations, editModal: false})
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
          from_chess: true
        }
      }).then((resp) => {
        NotificationManager.success('Бронювання видалено');
        this.setState({reservations: resp.reservations, editModal: false})
      });
    }
  }

  handleNewReservationDateChange = ({startDate, endDate}) => {
    this.setState({
      ...this.state,
      newReservation: {
        ...this.state.newReservation,
        startDate: startDate ? startDate.format('DD.MM.YYYY') : null,
        endDate: endDate ? endDate.format('DD.MM.YYYY') : null
      }
    })
  }

  handleNewReservationChange = (field, value) => {
    if (field === 'roomId') {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/booked_dates.json?date=${this.state.newReservation.startDate || new Date()}&room_id=${value}`,
        type: 'GET'
      }).then((resp) => this.setState({
        ...this.state,
        bookedDates: resp.blockedDates,
        newReservation: {
          ...this.state.newReservation,
          [field]: value
        }
      }))
    } else {
      this.setState({
        ...this.state,
        newReservation: {
          ...this.state.newReservation,
          [field]: value
        }
      })
    }
  }

  handleSubmitReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations.json`,
      type: 'POST',
      data: {
        from_chess: true,
        reservation: {
          hotel_id: this.state.hotelId,
          room_id: this.state.newReservation.roomId,
          name: this.state.newReservation.name,
          phone: this.state.newReservation.phone,
          places: this.state.newReservation.places,
          status: 'approved',
          description: this.state.newReservation.description,
          deposit: this.state.newReservation.deposit,
          start_date: this.state.newReservation.startDate,
          end_date: this.state.newReservation.endDate
        }
      }
    }).then((resp) => {
      if (resp.success) {
        NotificationManager.success('Бронювання створено');
        this.setState({
          ...this.state,
          reservations: resp.reservations,
          newReservation: {
            name: '',
            phone: '',
            places: this.state.hotelRooms[Object.keys(this.state.hotelRooms)[0]].places,
            description: '',
            deposit: '',
            startDate: null,
            endDate: null,
            roomId: Object.keys(this.state.hotelRooms)[0]
          },
          createModal: false
        })
      } else {
        NotificationManager.error(resp.error, 'Неможливо створити');
      }
    });
  }

  onTimeChange = (visibleTimeStart, visibleTimeEnd, updateScrollCanvas) => {
    this.setState({
      ...this.state,
      visibleTimeStart: visibleTimeStart,
      visibleTimeEnd: visibleTimeEnd
    })
    if (moment(visibleTimeStart).format('DD-MM-YYYY') != moment(this.state.visibleTimeStart).format('DD-MM-YYYY')) {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/rooms/chess.json?start_date=${moment(visibleTimeStart).format('DD-MM-YYYY')}&end_date=${moment(visibleTimeEnd).format('DD-MM-YYYY')}`,
        type: 'GET'
      }).then((resp) =>
        this.setState({
          ...this.state,
          reservations: resp.reservations
        })
      )
    }
  }

  render() {
    const items = this.convertedDates(this.state.reservations)
    const BAD_DATES = this.convertedBookedDates()
    const isDayBlocked = day => BAD_DATES.filter(d => d.isSame(day, 'day')).length > 0;
    return (
      <div className='container page-wraper'>
        <NotificationContainer/>
        <h3 className='text-center'>Завантаженість готелю</h3>
        <hr/>
        <button className='btn btn-info' onClick={() => this.handleModal('createModal')}><i className='fa fa-plus' /> Створити нове бронювання</button>
        <hr/>
        <Timeline
          onTimeChange={this.onTimeChange}
          groups={this.state.rooms}
          items={items}
          defaultTimeStart={moment().add(-1, 'day')}
          defaultTimeEnd={moment().add(30, 'day')}
          visibleTimeStart={this.state.visibleTimeStart}
          visibleTimeEnd={this.state.visibleTimeEnd}
          sidebarContent={'Номери'}
          canMove={false}
          canResize={false}
          canChangeGroup={false}
          itemHeightRatio={0.8}
          dragSnap={12 * 60 * 60 * 1000}
          groupRenderer={this.groupRenderer}
          minZoom={7 * 24 * 60 * 60 * 1000}
          maxZoom={30 * 86400 * 1000}
          onItemSelect={(itemId, e, time) => this.handleModal('editModal', itemId)}
        />
        { this.state.editModal &&
          <Modal isOpen={this.state.editModal} toggle={() => this.handleModal('editModal', '')}>
            <ModalHeader className='text-center' toggle={() => this.handleModal('editModal', '')}>
              <h5>Редагування бронювання</h5>
            </ModalHeader>
            <div className='reservation-form'>
              <div className='form-group'>
                <i className='fa fa-trash-o float-right' onClick={() => this.deleteReservation(this.state.selectedReservation.id)} />
                <label>Номер</label>
                <select className='form-control' value={this.state.selectedReservation.roomId} onChange={(e) => this.handleReservationChange('roomId', e.target.value)}>
                  { Object.values(this.state.hotelRooms).sort((a,b) => a.number - b.number).map((item, i) =>
                    <option key={i} value={item.id}>Поверх {this.state.hotelRooms[item.id].floor} | Номер {this.state.hotelRooms[item.id].number} | Місць: {this.state.hotelRooms[item.id].places} { this.state.hotelRooms[item.id].bigBed && '| Двоспальне ліжко'}</option>
                  )}
                </select>
              </div>
              <div className='form-group'>
                <label>Дати</label>
                <AirBnbPicker
                  getBlockedDates={this.getBlockedDates}
                  hotelId={this.state.hotelId}
                  onPickerApply={this.handleReservationDateChange}
                  startDate={this.state.selectedReservation.startDate}
                  endDate={this.state.selectedReservation.endDate}
                  isDayBlocked={isDayBlocked}
                />
              </div>
              <div className='form-group'>
                <label>Ім'я</label>
                <input type='text' className='form-control' value={this.state.selectedReservation.name} onChange={(e) => this.handleReservationChange('name', e.target.value)} />
              </div>
              <div className='form-group'>
                <label>Телефон</label>
                <input type='text' className='form-control' value={this.state.selectedReservation.phone} onChange={(e) => this.handleReservationChange('phone', e.target.value)} />
              </div>
              <div className='form-group'>
                <label>Кількість місць</label>
                <select className='form-control' value={this.state.selectedReservation.places} onChange={(e) => this.handleReservationChange('places', e.target.value)}>
                  { [...Array(parseInt(this.state.hotelRooms[this.state.selectedReservation.roomId].places, 10))].map((e,i) =>
                    <option key={i} value={i+1}>{i+1}</option>
                  )}
                </select>
              </div>
              <div className='form-group'>
                <label>Додаткова інформація</label>
                <textarea type='text' className='form-control' value={this.state.selectedReservation.description} onChange={(e) => this.handleReservationChange('description', e.target.value)} />
              </div>
              <div className='form-group'>
                <label>Завдаток</label>
                <input type='number' className='form-control' value={this.state.selectedReservation.deposit} onChange={(e) => this.handleReservationChange('deposit', e.target.value)} />
              </div>
            </div>
            <ModalFooter>
              <button className='btn btn-block btn-outline-info reservation-btn' onClick={this.handleSubmitEditReservation}>Редагувати</button>
            </ModalFooter>
          </Modal>}
        { this.state.createModal &&
          <Modal isOpen={this.state.createModal} toggle={() => this.handleModal('createModal')}>
            <ModalHeader className='text-center' toggle={() => this.handleModal('createModal')}>
              <h4>Створення нового бронювання</h4>
            </ModalHeader>
            <div className='reservation-form'>
              <div className='form-group'>
                <label>Номер</label>
                <select className='form-control' value={this.state.newReservation.roomId} onChange={(e) => this.handleNewReservationChange('roomId', e.target.value)}>
                  { Object.values(this.state.hotelRooms).sort((a,b) => a.number - b.number).map((item, i) =>
                    <option key={i} value={item.id}>Поверх {this.state.hotelRooms[item.id].floor} | Номер {this.state.hotelRooms[item.id].number} | Місць: {this.state.hotelRooms[item.id].places} { this.state.hotelRooms[item.id].bigBed && '| Двоспальне ліжко'}</option>
                  )}
                </select>
              </div>
              <div className='form-group'>
                <label>Дати</label>
                <AirBnbPicker
                  onPickerApply={this.handleNewReservationDateChange}
                  startDate={this.state.newReservation.startDate}
                  endDate={this.state.newReservation.endDate}
                  getBlockedDates={this.getBlockedDates}
                  isDayBlocked={isDayBlocked}/>
              </div>
              <div className='form-group'>
                <label>Ім'я</label>
                <input type='text' className='form-control' value={this.state.newReservation.name} onChange={(e) => this.handleNewReservationChange('name', e.target.value)} />
              </div>
              <div className='form-group'>
                <label>Телефон</label>
                <input type='text' className='form-control' value={this.state.newReservation.phone} onChange={(e) => this.handleNewReservationChange('phone', e.target.value)} />
              </div>
              <div className='form-group'>
                <label>Кількість місць</label>
                <select className='form-control' value={this.state.newReservation.places} onChange={(e) => this.handleNewReservationChange('places', e.target.value)}>
                  { [...Array(parseInt(this.state.hotelRooms[this.state.newReservation.roomId].places, 10))].map((e,i) =>
                    <option key={i} value={i+1}>{i+1}</option>
                  )}
                </select>
              </div>
              <div className='form-group'>
                <label>Додаткова інформація</label>
                <textarea type='text' className='form-control' value={this.state.newReservation.description} onChange={(e) => this.handleNewReservationChange('description', e.target.value)} />
              </div>
              <div className='form-group'>
                <label>Завдаток</label>
                <input type='number' className='form-control' value={this.state.newReservation.deposit} onChange={(e) => this.handleNewReservationChange('deposit', e.target.value)} />
              </div>
            </div>
            <ModalFooter>
              <button className='btn btn-block btn-outline-info reservation-btn' onClick={this.handleSubmitReservation}>Створити</button>
            </ModalFooter>
          </Modal>}
      </div>
    );
  }
}
