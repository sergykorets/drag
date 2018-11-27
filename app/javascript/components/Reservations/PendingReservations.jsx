import React, {Fragment} from 'react';
import moment from 'moment'
import RangePicker from 'bootstrap-daterangepicker';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Pagination from "react-js-pagination";
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Rooms from "../Rooms";

export default class PendingReservations extends React.Component {
  constructor(props) {
    super(props);

    moment.locale('uk');

    this.state = {
      hotelId: this.props.hotelId,
      reservations: this.props.reservations,
      activePage: 1,
      totalReservationsCount: this.props.totalReservationsCount,
      editModal: false,
      selectedReservation: {},
      rooms: this.props.rooms
    }
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

  handleSubmitEditReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotelId}/reservations/${this.state.selectedReservation.id}.json`,
      type: 'PATCH',
      data: {
        from_pending: true,
        page: this.state.activePage,
        reservation: {
          room_id: this.state.selectedReservation.roomId,
          name: this.state.selectedReservation.name,
          phone: this.state.selectedReservation.phone,
          places: this.state.selectedReservation.places,
          description: this.state.selectedReservation.description,
          start_date: this.state.selectedReservation.startDate,
          end_date: this.state.selectedReservation.endDate
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

  handleBookingRequest = (action, id) => {
    if (confirm( action === 'approved' ? 'Пiдтвердити дане бронювання?' : 'Скасувати дане бронювання?')) {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/reservations/${id}.json`,
        type: 'PATCH',
        data: {
          from_pending: true,
          page: this.state.activePage,
          reservation: {
            status: action
          }
        }
      }).then((resp) => {
        if (resp.success) {
          if (action === 'approved') {
            NotificationManager.success('Бронювання підтверджено');
          } else {
            NotificationManager.success('Бронювання відхилено');
          }
          this.setState({reservations: resp.reservations})
        } else {
          NotificationManager.error(resp.error, 'Неможливо виконати цю цію');
        }
      });
    }
  }

  deleteReservation = (id) => {
    if (confirm('Видалити дане бронювання?')) {
      $.ajax({
        url: `/hotels/${this.state.hotelId}/reservations/${id}.json`,
        type: 'DELETE',
        data: {
          from_pending: true,
          page: this.state.activePage
        }
      }).then((resp) => {
        NotificationManager.success('Бронювання видалено');
        this.setState({reservations: resp.reservations, editModal: false})
      });
    }
  }

  handlePageChange = (page) => {
    $.ajax({
      url: `/hotels/${this.props.hotelId}/rooms/pending_reservations.json`,
      type: 'GET',
      data: {
        page: page
      },
      success: (resp) => {
        this.setState({reservations: resp.reservations, activePage: page})
      }
    });
  }

  render() {
    console.log(this.state)
    return (
      <div className="container reservation-list page-wraper">
        <NotificationContainer/>
        <h3 className='text-center'>Список непідтверджених бронювань</h3>
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
            { ['Номер', 'Гість', 'Телефон', 'К-ть місць', 'Заїзд', 'Виїзд', 'Примітка', 'Дата запиту', 'Дії'].map((field, index) => {
              return (
                <th key={index}>
                  {field}
                </th>
              )})}
          </tr>
          </thead>
          <tbody>
          { Object.keys(this.state.reservations).sort((a, b) => b - a).map((r, i) => {
            const reservation = this.state.reservations[r]
            return (
              <tr key={i}>
                <td><a href={`/hotels/${this.state.hotelId}/rooms/calendar?id=${reservation.roomId}`}>{reservation.room}</a></td>
                <td>{reservation.name}</td>
                <td><a href={`tel:${reservation.phone}`}>{reservation.phone}</a></td>
                <td>{reservation.places}</td>
                <td>{reservation.startDate}</td>
                <td>{reservation.endDate}</td>
                <td>{reservation.description}</td>
                <td>{reservation.created}</td>
                <td>
                  <i className='fa fa-pencil' onClick={() => this.handleModal('editModal', r)}/>
                  <i className='fa fa-check' onClick={() => this.handleBookingRequest('approved', r)}/>
                  <i className='fa fa-times' onClick={() => this.handleBookingRequest('declined', r)}/>
                </td>
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
        { this.state.editModal &&
          <Modal isOpen={this.state.editModal} toggle={() => this.handleModal('editModal', '')}>
            <ModalHeader className='text-center' toggle={() => this.handleModal('editModal', '')}>
              <h5>Редагування запиту на бронювання</h5>
            </ModalHeader>
            <div className='reservation-form'>
              <div className='form-group'>
                <i className='fa fa-trash-o float-right' onClick={() => this.deleteReservation(this.state.selectedReservation.id)} />
                <label>Номер</label>
                <select className='form-control' value={this.state.selectedReservation.roomId} onChange={(e) => this.handleReservationChange('roomId', e.target.value)}>
                  { Object.keys(this.state.rooms).map((id, i) =>
                    <option key={i} value={id}>Поверх {this.state.rooms[id].floor} | Номер {this.state.rooms[id].number} | Місць: {this.state.rooms[id].places} { this.state.rooms[id].bigBed && '| Двоспальне ліжко'}</option>
                  )}
                </select>
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
                  { [...Array(parseInt(this.state.rooms[this.state.selectedReservation.roomId].places, 10))].map((e,i) =>
                    <option key={i} value={i+1}>{i+1}</option>
                  )}
                </select>
              </div>
              <div className='form-group'>
                <DateRangePicker autoApply onApply={this.handleReservationDateChange} startDate={this.state.selectedReservation.startDate} endDate={this.state.selectedReservation.endDate}>
                  <label>Дати</label>
                  <input readOnly type="text" className='form-control' value={`${this.state.selectedReservation.startDate} - ${this.state.selectedReservation.endDate}`}/>
                </DateRangePicker>
              </div>
              <div className='form-group'>
                <label>Додаткова інформація</label>
                <textarea type='text' className='form-control' value={this.state.selectedReservation.description} onChange={(e) => this.handleReservationChange('description', e.target.value)} />
              </div>
            </div>
            <ModalFooter>
              <button className='btn btn-block reservation-btn' onClick={this.handleSubmitEditReservation}>Редагувати</button>
            </ModalFooter>
          </Modal>}
      </div>
    );
  }
}
