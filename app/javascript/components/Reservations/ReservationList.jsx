import React, {Fragment} from 'react';
import moment from 'moment'
import RangePicker from 'bootstrap-daterangepicker';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Pagination from "react-js-pagination";
import {NotificationContainer, NotificationManager} from 'react-notifications';
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
      createModal: false,
      selectedReservation: {},
      newReservation: {
        name: '',
        phone: '',
        places: 1,
        startDate: moment(new Date).format('DD.MM.YYYY'),
        endDate: moment(new Date).add(1, 'days').format('DD.MM.YYYY'),
        roomId: Object.keys(this.props.rooms)[0]
      },
      rooms: this.props.rooms
    }
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
      selectedReservation: this.state.reservations[id]
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

  handleReservationDateChange = (event, picker) => {
    this.setState({
      ...this.state,
      selectedReservation: {
        ...this.state.selectedReservation,
        startDate: picker.startDate.format('DD.MM.YYYY'),
        endDate: picker.endDate.format('DD.MM.YYYY')
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

  handleSubmitEditReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations/${this.state.selectedReservation.id}.json`,
      type: 'PATCH',
      data: {
        from_list: true,
        start_date: this.state.startDate,
        end_date: this.state.endDate,
        reservation: {
          room_id: this.state.selectedReservation.roomId,
          name: this.state.selectedReservation.name,
          phone: this.state.selectedReservation.phone,
          places: this.state.selectedReservation.places,
          start_date: this.state.selectedReservation.startDate,
          end_date: this.state.selectedReservation.endDate
        }
      }
    }).then((resp) => {
      if (resp.success) {
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
          from_list: true,
          start_date: this.state.startDate,
          end_date: this.state.endDate
        }
      }).then((resp) => {
        this.setState({reservations: resp.reservations, editModal: false})
      });
    }
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

  handleSubmitReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations.json`,
      type: 'POST',
      data: {
        from_list: true,
        start_date: this.state.startDate,
        end_date: this.state.endDate,
        reservation: {
          hotel_id: this.state.hotelId,
          room_id: this.state.newReservation.roomId,
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
          reservations: resp.reservations,
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
    console.log('ReservationList', this.state)
    return (
      <div className="container reservation-list">
        <NotificationContainer/>
        <div className='top-actions'>
          <DateRangePicker onApply={this.handleDateChange} startDate={this.state.startDate} endDate={this.state.endDate}>
            <div className='row'>
              <div className='col-lg-6'>
                <label>Дата від:</label>
                <input type="text" className='form-control' value={this.state.startDate}/>
              </div>
              <div className='col-lg-6'>
                <label>Дата до:</label>
                <input type="text" className='form-control' value={this.state.endDate}/>
              </div>
            </div>
          </DateRangePicker>
          <button className='btn-dark' onClick={() => this.handleModal('createModal', '')}>Створити нове бронювання</button>
        </div>
        <hr/>
        { this.state.totalReservationsCount > 10 &&
        <Fragment>
          <Pagination
            activePage={this.state.activePage}
            itemsCountPerPage={10}
            totalItemsCount={this.state.totalReservationsCount}
            pageRangeDisplayed={Math.ceil(this.state.totalReservationsCount/10)}
            onChange={this.handlePageChange}
          />
          <hr/>
        </Fragment>}
        <table className='table reservation'>
          <thead>
          <tr>
            { ['Номер', 'Гість', 'Телефон', 'К-ть місць', 'Початок', 'Кінець', 'Дії'].map((field, index) => {
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
                  <td><button className='btn-dark' onClick={() => this.handleModal('editModal', r)}>Редагувати</button></td>
                </tr>
            )})}
          </tbody>
        </table>
        { this.state.totalReservationsCount > 10 &&
          <Fragment>
            <hr/>
            <Pagination
              activePage={this.state.activePage}
              itemsCountPerPage={10}
              totalItemsCount={this.state.totalReservationsCount}
              pageRangeDisplayed={Math.ceil(this.state.totalReservationsCount/10)}
              onChange={this.handlePageChange}
            />
          </Fragment>}
        { this.state.createModal &&
          <Modal isOpen={this.state.createModal} toggle={() => this.handleModal('createModal', '')}>
            <div className='reservation-form'>
              <label>Номер</label>
              <select className='form-control' value={this.state.newReservation.roomId} onChange={(e) => this.handleNewReservationChange('roomId', e.target.value)}>
                { Object.keys(this.state.rooms).map((id, i) =>
                  <option key={i} value={id}>Номер {this.state.rooms[id].number} - Кількість місць: {this.state.rooms[id].places}</option>
                )}
              </select>
              <label>Ім'я</label>
              <input type='text' className='form-control' value={this.state.newReservation.name} onChange={(e) => this.handleNewReservationChange('name', e.target.value)} />
              <label>Телефон</label>
              <input type='text' className='form-control' value={this.state.newReservation.phone} onChange={(e) => this.handleNewReservationChange('phone', e.target.value)} />
              <label>Кількість місць</label>
              <select className='form-control' value={this.state.newReservation.places} onChange={(e) => this.handleNewReservationChange('places', e.target.value)}>
                { [...Array(parseInt(this.state.rooms[this.state.newReservation.roomId].places, 10))].map((e,i) =>
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
          <Modal isOpen={this.state.editModal} toggle={() => this.handleModal('editModal', '')}>
            <div className='reservation-form'>
              <i className='fa fa-trash-o float-right' onClick={() => this.deleteReservation(this.state.selectedReservation.id)} />
              <label>Номер</label>
              <select className='form-control' value={this.state.selectedReservation.roomId} onChange={(e) => this.handleReservationChange('roomId', e.target.value)}>
                { Object.keys(this.state.rooms).map((id, i) =>
                  <option key={i} value={id}>Номер {this.state.rooms[id].number} - Кількість місць: {this.state.rooms[id].places}</option>
                )}
              </select>
              <label>Ім'я</label>
              <input type='text' className='form-control' value={this.state.selectedReservation.name} onChange={(e) => this.handleReservationChange('name', e.target.value)} />
              <label>Телефон</label>
              <input type='text' className='form-control' value={this.state.selectedReservation.phone} onChange={(e) => this.handleReservationChange('phone', e.target.value)} />
              <label>Кількість місць</label>
              <select className='form-control' value={this.state.selectedReservation.places} onChange={(e) => this.handleReservationChange('places', e.target.value)}>
                { [...Array(parseInt(this.state.rooms[this.state.selectedReservation.roomId].places, 10))].map((e,i) =>
                  <option key={i} value={i+1}>{i+1}</option>
                )}
              </select>
              <label>Дати</label>
              <DateRangePicker onApply={this.handleReservationDateChange} startDate={this.state.selectedReservation.startDate} endDate={this.state.selectedReservation.endDate}>
                <div className='row'>
                  <div className='col-lg-6'>
                    <input type="text" className='form-control' value={this.state.selectedReservation.startDate}/>
                  </div>
                  <div className='col-lg-6'>
                    <input type="text" className='form-control' value={this.state.selectedReservation.endDate}/>
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
