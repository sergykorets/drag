import React, {Fragment} from 'react';
import BigCalendar from 'react-big-calendar'
import createSlot from 'react-tackle-box/Slot'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import moment from 'moment'

export default class Room extends React.Component {
  constructor(props) {
    super(props);

    moment.locale('uk');

    this.state = {
      hotelId: this.props.hotelId,
      room: this.props.room,
      rooms: this.props.rooms,
      selectedReservation: {},
      newReservation: {
        name: '',
        phone: '',
        places: 1,
        startDate: moment(new Date).format('DD.MM.YYYY'),
        endDate: moment(new Date).add(1, 'days').format('DD.MM.YYYY'),
        roomId: Object.keys(this.props.rooms)[0]
      },
      editModal: false,
      createModal: false
    };
  }

  handleSelectReservation = (event, e) => {
    this.setState({selectedReservation: event, editModal: true})
  }

  handleModal = (modal) => {
    this.setState({
      ...this.state,
      [modal]: !this.state[modal],
    });
  }

  handleReservationChange = (field, value) => {
    this.setState({
      ...this.state,
      selectedReservation: {
        ...this.state.selectedReservation,
        [field]: value
      }
    })
  }

  handleNewReservationChange = (field, value) => {
    this.setState({
      ...this.state,
      newReservation: {
        ...this.state.newReservation,
        [field]: value
      }
    })
  }

  deleteReservation = () => {
    if (confirm('Видалити дане бронювання?')) {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/reservations/${this.state.selectedReservation.id}.json`,
        type: 'DELETE',
        data: {
          from_calendar: true,
          date: this.state.selectedMonth
        }
      }).then((resp) => {
        this.setState({
          ...this.state,
          editModal: false,
          room: {
            ...this.state.room,
            reservations: resp.reservations
          }
        });
      })
    }
  }

  handleSubmitEditReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations/${this.state.selectedReservation.id}.json`,
      type: 'PATCH',
      data: {
        date: this.state.selectedMonth,
        reservation: {
          name: this.state.selectedReservation.title,
          phone: this.state.selectedReservation.phone,
          places: this.state.selectedReservation.places,
          start_date: this.state.selectedReservation.start instanceof moment ? this.state.selectedReservation.start.format('DD.MM.YYYY') : this.state.selectedReservation.start,
          end_date: this.state.selectedReservation.end instanceof moment ? this.state.selectedReservation.end.format('DD.MM.YYYY') : this.state.selectedReservation.end
        }
      }
    }).then((resp) => {
      if (resp.success) {
        this.setState({
          ...this.state,
          editModal: false,
          room: {
            ...this.state.room,
            reservations: resp.reservations
          }
        });
      } else {
        NotificationManager.error(resp.error, 'Неможливо створити бронювання');
      }
    });
  }

  handleDateChange = (event, picker) => {
    this.setState({
      ...this.state,
      selectedReservation: {
        ...this.state.selectedReservation,
        start: picker.startDate,
        end: picker.endDate
      }
    })
  }

  handleNewReservationDateChange = (event, picker) => {
    this.setState({
      ...this.state,
      newReservation: {
        ...this.state.newReservation,
        startDate: picker.startDate.format('DD.MM.YYYY'),
        endDate: picker.endDate.format('DD.MM.YYYY')
      }
    })
  }

  handleRoomChange = (id) => {
    $.ajax({
      url: `/hotels/${this.props.hotelId}/rooms/calendar.json`,
      type: 'GET',
      dataType: 'JSON',
      data: {
        id: id
      },
      success: (resp) => {
        this.setState({
          ...this.state,
          room: resp.room
        })
      }
    });
  }

  handleMonthChange = (date) => {
    $.ajax({
      url: `/hotels/${this.props.hotelId}/rooms/calendar.json`,
      type: 'GET',
      dataType: 'JSON',
      data: {
        id: this.state.room.id,
        date: date
      },
      success: (resp) => {
        this.setState({
          ...this.state,
          room: resp.room,
          selectedMonth: date
        })
      }
    });
  }

  handleSubmitReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations.json`,
      type: 'POST',
      data: {
        from_calendar: true,
        date: this.state.selectedMonth,
        reservation: {
          hotel_id: this.state.hotelId,
          room_id: this.state.room.id,
          name: this.state.newReservation.name,
          phone: this.state.newReservation.phone,
          places: this.state.newReservation.places,
          start_date: this.state.newReservation.startDate,
          end_date: this.state.newReservation.endDate
        }
      }
    }).then((resp) => {
      if (resp.success) {
        this.setState({
          ...this.state,
          room: {
            ...this.state.room,
            reservations: resp.reservations
          },
          newReservation: {
            name: '',
            phone: '',
            places: 1,
            startDate: moment(new Date).format('DD.MM.YYYY'),
            endDate: moment(new Date).add(1, 'days').format('DD.MM.YYYY'),
            roomId: Object.keys(this.state.rooms)[0]
          },
          createModal: false
        })
      } else {
        NotificationManager.error(resp.error, 'Неможливо створити');
      }
    });
  }

  render() {
    console.log('Room', this.state)
    const localizer = BigCalendar.momentLocalizer(moment)
    return (
      <div className="container">
        <NotificationContainer/>
        <div className='calendar-top'>
          <select className='form-control' value={this.state.room.id} onChange={(e) => this.handleRoomChange(e.target.value)}>
            { Object.keys(this.state.rooms).map((id, i) =>
              <option key={i} value={id}>Номер {this.state.rooms[id].number} - Кількість місць: {this.state.rooms[id].places}</option>
            )}
          </select>
          <button className='btn-dark' onClick={() => this.handleModal('createModal')}>Створити нове бронювання</button>
        </div>
        <hr/>
        <div className='room-calendar'>
          <createSlot waitForOutlet />
          <BigCalendar
            views={['month']}
            onNavigate={this.handleMonthChange}
            localizer={localizer}
            events={this.state.room.reservations}
            selectable
            popup
            onSelectEvent={this.handleSelectReservation}
            startAccessor="start"
            endAccessor="end"
          />
        </div>
        { this.state.createModal &&
          <Modal isOpen={this.state.createModal} toggle={() => this.handleModal('createModal')}>
            <div className='reservation-form'>
              <label>Ім'я</label>
              <input type='text' className='form-control' value={this.state.newReservation.name} onChange={(e) => this.handleNewReservationChange('name', e.target.value)} />
              <label>Телефон</label>
              <input type='text' className='form-control' value={this.state.newReservation.phone} onChange={(e) => this.handleNewReservationChange('phone', e.target.value)} />
              <label>Кількість місць</label>
              <select className='form-control' value={this.state.newReservation.places} onChange={(e) => this.handleNewReservationChange('places', e.target.value)}>
                { [...Array(parseInt(this.state.room.places, 10))].map((e,i) =>
                  <option key={i} value={i+1}>{i+1}</option>
                )}
              </select>
              <label>Дати</label>
              <DateRangePicker
                onApply={this.handleNewReservationDateChange}
                startDate={this.state.newReservation.startDate}
                endDate={this.state.newReservation.endDate}>
                <div className='row'>
                  <div className='col-lg-6'>
                    <input type="text" className='form-control' value={this.state.newReservation.startDate}/>
                  </div>
                  <div className='col-lg-6'>
                    <input type="text" className='form-control' value={this.state.newReservation.endDate}/>
                  </div>
                </div>
              </DateRangePicker>
              <hr/>
              <button className='btn btn-block reservation-btn' onClick={this.handleSubmitReservation}>Створити</button>
            </div>
          </Modal>}
        { this.state.editModal &&
          <Modal isOpen={this.state.editModal} toggle={() => this.handleModal('editModal')}>
            <div className='reservation-form'>
              <i className='fa fa-trash-o float-right' onClick={this.deleteReservation} />
              <label>Ім'я</label>
              <input type='text' className='form-control' value={this.state.selectedReservation.title} onChange={(e) => this.handleReservationChange('title', e.target.value)} />
              <label>Телефон</label>
              <input type='text' className='form-control' value={this.state.selectedReservation.phone} onChange={(e) => this.handleReservationChange('phone', e.target.value)} />
              <label>Кількість місць</label>
              <select className='form-control' value={this.state.selectedReservation.places} onChange={(e) => this.handleReservationChange('places', e.target.value)}>
                { [...Array(parseInt(this.state.room.places, 10))].map((e,i) =>
                  <option key={i} value={i+1}>{i+1}</option>
                )}
              </select>
              <label>Дати</label>
              <DateRangePicker onApply={this.handleDateChange} startDate={moment(this.state.selectedReservation.start).format('DD.MM.YYYY')} endDate={moment(this.state.selectedReservation.end).format('DD.MM.YYYY')}>
                <div className='row'>
                  <div className='col-lg-6'>
                    <input type="text" className='form-control' value={moment(this.state.selectedReservation.start).format('DD.MM.YYYY')}/>
                  </div>
                  <div className='col-lg-6'>
                    <input type="text" className='form-control' value={moment(this.state.selectedReservation.end).format('DD.MM.YYYY')}/>
                  </div>
                </div>
              </DateRangePicker>
            </div>
            <div>
              <hr/>
              <button className='btn btn-block reservation-btn' onClick={this.handleSubmitEditReservation}>Редагувати</button>
            </div>
          </Modal>}
      </div>
    );
  }
}
