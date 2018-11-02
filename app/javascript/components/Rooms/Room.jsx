import React, {Fragment} from 'react';
import BigCalendar from 'react-big-calendar'
import createSlot from 'react-tackle-box/Slot'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
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
      editModal: false
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

  deleteReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations/${this.state.selectedReservation.id}.json`,
      type: 'DELETE',
      data: {
        from_calendar: true
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

  handleSubmitEditReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations/${this.state.selectedReservation.id}.json`,
      type: 'PATCH',
      data: {
        reservation: {
          name: this.state.selectedReservation.title,
          phone: this.state.selectedReservation.phone,
          places: this.state.selectedReservation.places,
          start_date: this.state.selectedReservation.start.format('DD.MM.YYYY'),
          end_date: this.state.selectedReservation.end.format('DD.MM.YYYY')
        }
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
          room: resp.room
        })
      }
    });
  }

  render() {
    console.log('Room', this.state)
    const localizer = BigCalendar.momentLocalizer(moment)
    return (
      <div className="container">
        <select className='form-control' value={this.state.room.id} onChange={(e) => this.handleRoomChange(e.target.value)}>
          { Object.keys(this.state.rooms).map((id, i) =>
            <option key={i} value={id}>{this.state.rooms[id].number}</option>
          )}
        </select>
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
        { this.state.editModal &&
          <Modal isOpen={this.state.editModal} toggle={() => this.handleModal('editModal')}>
            <div className='reservation-form'>
              <i className='fa fa-trash-o' onClick={this.deleteReservation} />
              <label>Name</label>
              <input type='text' className='form-control' value={this.state.selectedReservation.title} onChange={(e) => this.handleReservationChange('title', e.target.value)} />
              <label>Phone</label>
              <input type='text' className='form-control' value={this.state.selectedReservation.phone} onChange={(e) => this.handleReservationChange('phone', e.target.value)} />
              <label>Places</label>
              <input type='number' className='form-control' value={this.state.selectedReservation.places} onChange={(e) => this.handleReservationChange('places', e.target.value)} />
              <label>Dates</label>
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
            <button className='btn btn-block' onClick={this.handleSubmitEditReservation}>Submit</button>
          </Modal>}
      </div>
    );
  }
}
