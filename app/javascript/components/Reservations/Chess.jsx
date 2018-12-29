import React, {Fragment} from 'react';
import interactjs from 'interactjs'
import moment from 'moment'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Timeline from 'react-calendar-timeline'

export default class Chess extends React.Component {
  constructor(props) {
    super(props);

    moment.locale('uk');

    this.state = {
      hotelId: this.props.hotelId,
      reservations: this.props.reservations,
      rooms: this.props.rooms
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

  render() {
    const items = this.convertedDates(this.state.reservations)
    return (
      <div className='container'>
        <Timeline
          groups={this.state.rooms}
          items={items}
          defaultTimeStart={moment().add(-15, 'day')}
          defaultTimeEnd={moment().add(15, 'day')}
          sidebarContent={'Номери'}
          canMove={false}
          canResize={false}
          canChangeGroup={false}
          itemHeightRatio={0.8}
          dragSnap={12 * 60 * 60 * 1000}
        />
      </div>
    );
  }
}
