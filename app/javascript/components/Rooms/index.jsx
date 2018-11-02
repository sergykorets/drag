import React, {Fragment} from 'react';

export default class Rooms extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hotelId: this.props.hotelId,
      rooms: Object.keys(this.props.rooms).length > 0 ? this.props.rooms : {number: '', floor: '', places: ''}
    };
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
      const items = this.state.rooms;
      items[i] = {id: items[i].id, _destroy: '1'};
      this.setState({rooms: items})
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
          rooms_attributes: this.state.rooms
        }
      },
      success: (resp) => {
        if (resp.success) {
          window.location.href = `/hotels/${resp.slug}`
        } else {
          window.location.reload()
        }
      }
    });
  }

  render() {
    console.log('Rooms', this.state)
    return (
      <div className="container">
        <div className='row'>
          { Object.keys(this.state.rooms).map((i) => {
            const room = this.state.rooms[i]
            if (!room._destroy) {
              return (
                <div key={i} className="room col-lg-2">
                  <i className='fa fa-trash-o float-right' onClick={() => this.deleteRoom(i)} />
                  <label>Number</label>
                  <input type="number" className='form-control' value={room.number} onChange={(e) => this.handleRoomChange('number', i, e.target.value)} />
                  <label>Floor</label>
                  <input type="number" className='form-control' value={room.floor} onChange={(e) => this.handleRoomChange('floor', i, e.target.value)} />
                  <label>Places</label>
                  <input type="number" className='form-control' value={room.places} onChange={(e) => this.handleRoomChange('places', i, e.target.value)} />
                </div>
              )}})}
        </div>
        <div className='form-group'>
          <i className='fa fa-plus btn btn-info' onClick={this.addRoom}> Add room</i>
        </div>
        <hr/>
        <div className='form-group'>
          <button className='btn btn-dark' onClick={this.handleSubmit}>Submit</button>
        </div>
      </div>
    );
  }
}
