import React, {Fragment} from 'react';
import moment from 'moment'
import RangePicker from 'bootstrap-daterangepicker';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Pagination from "react-js-pagination";
import Rooms from "../Rooms";

export default class ReservationList extends React.Component {
  constructor(props) {
    super(props);

    moment.locale('uk');

    this.state = {
      hotelId: this.props.hotelId,
      reservations: this.props.reservations,
      startDate: moment(new Date).format('DD.MM.YYYY'),
      endDate: moment(new Date).add(1, 'days').format('DD.MM.YYYY'),
      activePage: 1,
      totalReservationsCount: this.props.totalReservationsCount,
      editModal: false,
      selectedReservationId: ''
    }
  }

  componentDidMount() {
  }

  handleDateChange = (event, picker) => {
    $.ajax({
      url: `/hotels/${this.props.hotelId}/reservation_list.json`,
      type: 'GET',
      data: {
        start_date: picker.startDate.format('DD.MM.YYYY'),
        end_date: picker.endDate.format('DD.MM.YYYY')
      },
      success: (resp) => {
        this.setState({startDate: picker.startDate.format('DD.MM.YYYY'), endDate: picker.endDate.format('DD.MM.YYYY'), reservations: resp.reservations, totalReservationsCount: resp.totalReservationsCount})
      }
    });
  }

  handleInputChange = (field, value) => {
    this.setState({[field]: value})
  }

  handleModal = (modal, id) => {
    this.setState({
      [modal]: !this.state[modal],
      selectedReservationId: id
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
      this.setState({rooms: resp.rooms, createModal: false, name: '', phone: '', places: ''})
    });
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
      this.setState({rooms: resp.rooms, editModal: false})
    });
  }

  deleteReservation = (id) => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations/${id}.json`,
      type: 'DELETE',
      data: {
        floor: this.state.floor,
        start_date: this.state.startDate,
        end_date: this.state.endDate
      }
    }).then((resp) => {
      this.setState({rooms: resp.rooms})
    });
  }

  handlePageChange = (page) => {
    $.ajax({
      url: `/hotels/${this.props.hotelId}/reservation_list.json`,
      type: 'GET',
      data: {
        page: page,
        start_date: this.state.startDate,
        end_date: this.state.endDate
      },
      success: (resp) => {
        this.setState({reservations: resp.reservations, activePage: page})
      }
    });
  }

  render() {
    console.log('ReservationList', this.state)
    return (
      <div className="container reservation-list">
        <DateRangePicker onApply={this.handleDateChange} startDate={this.state.startDate} endDate={this.state.endDate}>
          <div className='row'>
            <div className='col-lg-6'>
              <input type="text" className='form-control' value={this.state.startDate}/>
            </div>
            <div className='col-lg-6'>
              <input type="text" className='form-control' value={this.state.endDate}/>
            </div>
          </div>
        </DateRangePicker>
        <table className='table reservation'>
          <thead>
          <tr>
            { ['room', 'name', 'phone', 'places', 'startDate', 'endDate', 'actions'].map((field, index) => {
              return (
                <th key={index}>
                  {field}
                </th>
              )})}
          </tr>
          </thead>
          <tbody>
            { Object.keys(this.state.reservations).map((r, i) => {
              const reservation = this.state.reservations[r]
              return (
                <tr key={i}>
                  <td><a href={`/hotels/${this.state.hotelId}/rooms/calendar?id=${reservation.roomId}`}>{reservation.room}</a></td>
                  <td>{reservation.name}</td>
                  <td>{reservation.phone}</td>
                  <td>{reservation.places}</td>
                  <td>{reservation.startDate}</td>
                  <td>{reservation.endDate}</td>
                  <td><button className='btn-dark' onClick={() => this.handleModal('editModal', r)}>Edit</button></td>
                </tr>
            )})}
          </tbody>
        </table>
        { this.state.totalReservationsCount > 10 &&
          <Pagination
            activePage={this.state.activePage}
            itemsCountPerPage={10}
            totalItemsCount={this.state.totalReservationsCount}
            pageRangeDisplayed={Math.ceil(this.state.totalReservationsCount/10)}
            onChange={this.handlePageChange}
          />}
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
