import React, {Fragment} from 'react';
import firebase from './firebase';
import { MessageList, Button, Input } from 'react-chat-elements';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import moment from 'moment';


export default class Chat extends React.Component {
  constructor(props) {
    super(props);

    moment.locale('uk');

    this.database = firebase.database().ref().child('messages');

    this.state = {
      message: '',
      messages: {},
      lastMessage: ''
    };
  }

  componentDidMount() {
    this.database.limitToLast(50).on('value', snap => {
      if (snap.val()) {
        this.setState({
          ...this.state,
          messages: snap.val(),
          lastMessage: Object.values(snap.val())[0].time
        })
      }
    })
  }

  sendMessage = () => {
    if (this.props.user) {
      if (this.state.message.trim().length > 0) {
        $('.rce-input').val('');
        this.setState({message: ''});
        this.database.push({
          body: this.state.message, time: Date.now(), user_name: this.props.user.name, user_id: this.props.user.id
        });
      } else {
        NotificationManager.error('Повідомлення не може бути пустим', 'Неможливо відправити повідомлення');
      }
    } else {
      location.href = '/users/sign_in'
    }
  };

  handleInputChange = (text) => {
    this.setState({message: text})
  };

  handleKeyDown = (key) => {
    if (key === 'Enter') {
      this.sendMessage();
    }
  };

  handleScroll = (e) => {
    const isTop = e.target.scrollTop <= 100;
    if (isTop) {
      this.database.orderByChild('time').endAt(this.state.lastMessage).limitToLast(20).on('value', snap => {
        console.log(snap.val());
        this.setState({
          ...this.state,
          messages: Object.assign(this.state.messages, snap.val()),
          lastMessage: Object.values(snap.val())[0].time
        })
      })
    }
  };

  render() {
      return (
        <div className='container'>
          <NotificationContainer/>
          <MessageList
            onScroll={(e) => this.handleScroll(e)}
            className='message-list'
            dataSource={ Object.values(this.state.messages).sort((a, b) => a.time - b.time).map((message, i) => {
              return (
                { position: this.props.user && (message.user_id === this.props.user.id) ? 'right' : 'left',
                  type: 'text',
                  text: message.body,
                  date: message.time,
                  title: message.user_name,
                  dateString: moment(message.time).format('DD.MM.YY HH:mm')
                }
              )
            })}
          />
          <Input placeholder="Пиши тут..."
                 defaultValue=''
                 onKeyDown={(e) => this.handleKeyDown(e.key)}
                 onChange={(e) => this.handleInputChange(e.target.value)}
                 rightButtons={
                   <Button
                     color='white'
                     backgroundColor='black'
                     text='Надіслати'
                     onClick={() => this.sendMessage()}
                   />
                 }
          />
        </div>
      )
  }
}