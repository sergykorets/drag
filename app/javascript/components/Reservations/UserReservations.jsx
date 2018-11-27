import React, {Fragment} from 'react';
import { Tooltip } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';

export default class UserReservations extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      reservations: this.props.reservations,
      tooltips: {}
    }
  }

  toggle = (index, value) => {
    this.setState({
      ...this.state,
      tooltips: {
        ...this.state.tooltips,
        [index]: value
      }
    });
  }

  render() {
    return (
      <div className="container reservation-list page-wraper">
        <table className='table reservation'>
          <thead>
          <tr>
            { ['Готель', "Номер", 'К-ть місць', 'Заїзд', 'Виїзд', 'Примітка', 'Статус'].map((field, index) => {
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
                <td>{reservation.hotel.name}</td>
                <td>{reservation.room.number}</td>
                <td>{reservation.places}</td>
                <td>{reservation.startDate}</td>
                <td>{reservation.endDate}</td>
                <td>{reservation.description}</td>
                <td>{reservation.status === 'approved' ? <i id={`status-${i}`} className='fa fa-check'/> : (reservation.status === 'declined' ? <i id={`status-${i}`} className='fa fa-times'/> : <i id={`status-${i}`} className='fa fa-question-circle'/>)}</td>
                <Tooltip placement="bottom" isOpen={this.state.tooltips[i]} target={`status-${i}`} toggle={() => this.toggle(i, !this.state.tooltips[i])}>
                  {reservation.status}
                </Tooltip>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    );
  }
}
