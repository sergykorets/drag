import React, {Fragment} from 'react';
import Rater from 'react-rating'
import ImageGallery from 'react-image-gallery';
import ReactGA from 'react-ga';
import ReactPixel from 'react-facebook-pixel';
import Leaflet from 'leaflet';
import moment from 'moment'
import { Modal, ModalHeader, ModalFooter, ModalBody, Tooltip } from 'reactstrap';
import { Map, Marker, Popup, TileLayer, GeoJSON } from 'react-leaflet';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import AirBnbPicker from "../common/AirBnbPicker";

export default class Hotel extends React.Component {
  constructor(props) {
    super(props);

    moment.locale('uk');

    this.state = {
      hotel: this.props.hotel,
      review: this.props.hotel.sessionComment,
      reviewRating: 0,
      nearbyHotels: this.props.nearbyHotels,
      logged: this.props.logged,
      admin: this.props.admin,
      owner: this.props.owner,
      suggestEmail: '',
      suggestBody: '',
      showSuggestForm: false,
      bookingModal: false,
      tooltips: {},
      reservation: {
        roomId: '',
        name: this.props.userName,
        phone: '',
        places: '',
        startDate: null,
        endDate: null
      },
      blockedDates: [],
      availableRooms: [],
      replyForms: {},
      reply: '',
      showPhone: false
    };
  }

  componentDidMount() {
    if (!(this.state.admin || this.state.owner)) {
      ReactGA.initialize('UA-116820611-2');
      ReactGA.pageview(window.location.pathname + window.location.search);
      ReactGA.ga('send', 'pageview', `/hotels/${this.state.hotel.slug}`);
      ga('send', {'name': 'viewContent', 'productId': this.state.hotel.id, 'productName': this.state.hotel.name});
      ReactPixel.track('ViewContent', { content_ids: [this.state.hotel.id], content_name: this.state.hotel.name, content_type: 'Hotel'})
    }
  }

  handleInputChange = (field, value) => {
    this.setState({[field]: value})
    if (field === 'showPhone' && !(this.state.admin || this.state.owner)) {
      ga('send', {'name': 'purchase', 'productIds': this.state.hotel.id, 'revenue': (this.state.hotel.price / 100)})
      ga('require', 'ecommerce')
      ga('ecommerce:addTransaction', {'id': new Date().getTime(), 'revenue': (this.state.hotel.price / 100), 'currency': 'USD' })
      ga('ecommerce:addItem', {'id': this.state.hotel.id, 'name': this.state.hotel.name, 'quantity': 1, 'price': (this.state.hotel.price / 100)})
      ga('ecommerce:send')
      ReactPixel.track('Purchase', { content_ids: [this.state.hotel.id], content_name: this.state.hotel.name, content_type: 'Hotel', value: (this.state.hotel.price / 100)})
    }
  }

  submitReview = () => {
    $.ajax({
      url: `/hotels/${this.state.hotel.slug}/reviews.json`,
      type: 'POST',
      data: {
        review: {
          rating: this.state.reviewRating,
          comment: this.state.review
        }
      },
      success: (resp) => {
        if (resp.success) {
          NotificationManager.success('Відгук залишено')
          window.location.href = this.state.hotel.slug
        } else {
          window.location.href = resp.signInPath
        }
      }
    });
  }

  deleteReview = (id) => {
    if(confirm('Видалити відгук?')) {
      $.ajax({
        url: `/hotels/${this.state.hotel.slug}/reviews/${id}.json`,
        type: 'DELETE',
        success: (resp) => {
          NotificationManager.success('Відгук видалено')
          window.location.reload()
        }
      });
    }
  }

  replayGif = () => {
    document.getElementById('adrenalin').src='/images/Adrenalin_UA.gif'
  }

  submitSuggest = () => {
    $.ajax({
      url: `/suggests.json`,
      type: 'POST',
      data: {
        hotel_id: this.state.hotel.id,
        suggest: {
          email: this.state.suggestEmail,
          body: this.state.suggestBody
        }
      }
    }).then((resp) => {
      if (resp.success) {
        NotificationManager.success('Дякуємо за допомогу ;)')
      } else {
        NotificationManager.error(resp.error, 'Неможливо надіслати')
      }
    });
  }

  handleModal = (type) => {
    if (type === 'bookingModal') {
      $.ajax({
        url: `/hotels/${this.state.hotel.slug}/booked_dates.json`,
        type: 'GET'
      }).then((resp) =>
        this.setState({
          blockedDates: resp.blockedDates,
          [type]: !this.state[type]
        })
      )
    } else {
      this.setState({
        [type]: !this.state[type]
      });
    }
  }

  toggle = (index, field) => {
    this.setState({
      ...this.state,
      tooltips: {
        ...this.state.tooltips,
        [index]: {
          ...this.state.tooltips[index],
          [field]: this.state.tooltips[index] && !this.state.tooltips[index][field]
        }
      }
    });
  }

  toggleTooltip = (field) => {
    this.setState({
      ...this.state,
      tooltips: {
        ...this.state.tooltips,
        [field]: !this.state.tooltips[field]
      }
    });
  }

  handleNewReservationChange = (field, value) => {
    this.setState({
      ...this.state,
      reservation: {
        ...this.state.reservation,
        [field]: value
      }
    })
  }

  handleNewReservationDateChange = ({startDate, endDate}) => {
    this.setState({
      ...this.state,
      reservation: {
        ...this.state.reservation,
        startDate: startDate ? startDate.format('DD.MM.YYYY') : null,
        endDate: endDate ? endDate.format('DD.MM.YYYY') : null
      }
    })
    if (startDate && endDate) {
      this.getAvailableRooms(startDate, endDate)
    }
  }

  convertedDates = () => {
    const dates = this.state.blockedDates.map((date) => {
      return moment(date)
    })
    return dates
  }

  getAvailableRooms = (startDate, endDate) => {
    $.ajax({
      url: `/hotels/${this.state.hotel.slug}/get_available_rooms.json?start_date=${startDate.format('YYYY-MM-DD')}&end_date=${endDate.format('YYYY-MM-DD')}`,
      type: 'GET'
    }).then((resp) =>
      this.setState({
        ...this.state,
        availableRooms: resp.availableRooms,
        reservation: {
          ...this.state.reservation,
          roomId: resp.availableRooms.length > 0 ? resp.availableRooms[0].id : ''
        }
      })
    )
  }

  getBlockedDates = (date) => {
    $.ajax({
      url: `/hotels/${this.state.hotel.slug}/booked_dates.json?date=${date.format('YYYY-MM-DD')}`,
      type: 'GET'
    }).then((resp) => this.setState({ blockedDates: resp.blockedDates }))
  }

  handleSubmitReservation = () => {
    $.ajax({
      url: `/hotels/${this.state.hotel.id}/reservations.json`,
      type: 'POST',
      data: {
        from_user: true,
        reservation: {
          hotel_id: this.state.hotel.id,
          room_id: this.state.reservation.roomId,
          name: this.state.reservation.name,
          phone: this.state.reservation.phone,
          description: this.state.reservation.description,
          places: 'all',
          start_date: this.state.reservation.startDate,
          end_date: this.state.reservation.endDate,
        }
      }
    }).then((resp) => {
      if (resp.success) {
        this.setState({
          ...this.state,
          reservation: {
            roomId: '',
            name: '',
            phone: '',
            places: '',
            description: '',
            startDate: null,
            endDate: null
          },
          bookingModal: false,
          availableRooms: []
        })
        if (this.state.hotel.autoBooking) {
          NotificationManager.success("Зв'яжіться з готелем для уточнення інформації бронювання", 'Номер заброньовано');
        } else {
          NotificationManager.success('Адміністратор перевірить Ваш запит', 'Запит на бронювання надіслано');
        }
      } else {
        NotificationManager.error(resp.error, 'Неможливо забронювати номер');
      }
    });
  }

  deleteReply = (id) => {
    if(confirm('Видалити відповідь?')) {
      $.ajax({
        url: `/hotels/${this.state.hotel.slug}/replies/${id}.json`,
        type: 'DELETE',
        success: (resp) => {
          NotificationManager.success('Відповідь видалено')
          window.location.reload()
        }
      });
    }
  }

  showReplyForm = (id) => {
    this.setState({
      ...this.state,
      replyForms: {
        ...this.state.replyForms,
        [id]: !this.state.replyForms[id]
      }
    })
  }

  submitReply = (id, google) => {
    $.ajax({
      url: `/hotels/${this.state.hotel.slug}/replies.json`,
      type: 'POST',
      data: {
        reply: {
          repliable_id: id,
          body: this.state.reply,
          google: google
        }
      },
      success: (resp) => {
        if (resp.success) {
          NotificationManager.success('Відповідь залишено')
          window.location.reload()
        } else {
          NotificationManager.error('Відповідь не залишено')
          window.location.reload()
        }
      }
    });
  }

  trackBooking = () => {
    if (!(this.state.admin || this.state.owner)) {
      ga('send', 'event', 'Booking', 'click', this.state.hotel.name);
    }
  }

  render() {
    const images = this.state.hotel.photos.map((photo) => {return ({ original: photo.photo, thumbnail: photo.photo, description: photo.name})})
    const BAD_DATES = this.convertedDates()
    const isDayBlocked = day => BAD_DATES.filter(d => d.isSame(day, 'day')).length > 0;
    return (
      <div className="container page-wraper">
        <NotificationContainer/>
        { images.length > 0 &&
          <Fragment>
            <ImageGallery items={images} additionalClass='custom-gallery' autoPlay />
          </Fragment>}
        <div className='info-block'>
          <div className='hotel-info'>
            <div className='hotel-header'>
              <h1 className='hotel-name'>{this.state.hotel.name}</h1>
              { this.state.hotel.hotelType === 'lodging' ? <span>{this.state.hotel.price} {this.state.hotel.price && 'UAH'}</span>
                :
                <Rater initialRating={parseFloat(this.state.hotel.googleRating)} emptySymbol="fa fa-star-o fa-2x" fullSymbol="fa fa-star fa-2x" readonly className='hotel-stars'/>}
            </div>
            { this.state.hotel.hotelType === 'lodging' &&
              <div className='hotel-header activities'>
                <div className='hotel-icons'>
                  <div id='sauna' className={`icon ${this.state.hotel.sauna && 'present'}`}>
                    <img src="/images/sauna.svg"/>
                    <p>Баня</p>
                  </div>
                  { !this.state.hotel.sauna &&
                    <Tooltip placement="bottom" isOpen={this.state.tooltips.sauna} target='sauna' toggle={() => this.toggleTooltip('sauna')}>
                      Немає
                    </Tooltip>}
                  <div id='chan' className={`icon ${this.state.hotel.chan && 'present'}`}>
                    <img src="/images/chan.png"/>
                    <p>Чан</p>
                  </div>
                  { !this.state.hotel.chan &&
                    <Tooltip placement="bottom" isOpen={this.state.tooltips.chan} target='chan' toggle={() => this.toggleTooltip('chan')}>
                      Немає
                    </Tooltip>}
                  <div id='disco' className={`icon ${this.state.hotel.disco && 'present'}`}>
                    <img src="/images/disco.svg"/>
                    <p>Диско</p>
                  </div>
                  { !this.state.hotel.disco &&
                    <Tooltip placement="bottom" isOpen={this.state.tooltips.disco} target='disco' toggle={() => this.toggleTooltip('disco')}>
                      Немає
                    </Tooltip>}
                </div>
                <Rater initialRating={parseFloat(this.state.hotel.googleRating)} emptySymbol="fa fa-star-o fa-2x"
                       fullSymbol="fa fa-star fa-2x" readonly className='hotel-stars'/>
              </div>}
            <div className='hotel-description'>
              <span dangerouslySetInnerHTML={{__html: this.state.hotel.description}}></span>
            </div>
          </div>
          <div className='right'>
            <div className='actions-block'>
              { this.state.showPhone ?
                <div className='phones'>
                  { this.state.hotel.phones.map((phone, i) => {
                    return (
                      <a href={`tel:${phone}`} className='phone' key={i}>
                        {phone}
                      </a>
                    )})}
                </div>
                :
                <Fragment>
                  { this.state.hotel.phones.length > 0 && <button className='btn btn-success' onClick={() => this.handleInputChange('showPhone', !this.state.showPhone)}><i className="fa fa-phone"></i> Дзвонити</button>}
                </Fragment>}
              <div className='hotel-buttons text-center'>
                { this.state.hotel.allowBooking &&
                  <Fragment>
                    { this.state.hotel.id === 54 ?
                      <a className='btn btn-warning' href='https://drf.com.ua/uk/broniuvannia-nomeru.html' target='_blank' onClick={() => this.trackBooking()}>Бронювати</a> :
                      <button className='btn btn-warning' onClick={() => this.handleModal('bookingModal')}>Бронювати</button>}
                  </Fragment>
                }
                { this.state.hotel.site &&
                  <a className='btn btn-outline-danger' href={this.state.hotel.site} target="_blank">Офіційний сайт</a>}
                { this.state.hotel.location &&
                  <a className='btn btn-dark' href={this.state.hotel.location} target="_blank">3D карта</a>}
                { this.state.hotel.editable &&
                  <a className='btn btn-info' href={`${this.state.hotel.slug}/edit`}>Редагувати</a>}
                { this.state.hotel.editable &&
                  <a className='btn btn-danger' href={`${this.state.hotel.slug}/rooms`}>Адміністрування</a>}
                <button className='btn btn-outline-warning suggest' onClick={() => this.handleModal('showSuggestForm')}>Запропонувати зміни</button>
              </div>
            </div>
            { this.state.hotel.bookingLink &&
              <div className='actions-block booking'>
                <p>Забронювати на</p>
                <a target="_blank" href={this.state.hotel.bookingLink}>
                  <img src="/images/booking.jpg" />
                </a>
              </div>}
            <div className='partners'>
              <div className='partner'>
                <iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FDragobratUA%2F&tabs&width=250&height=70&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false&appId=783416265322787" width="250" height="130" style={{border:'none',overflow:'hidden'}} scrolling="no" frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>
              </div>
              <div className='partner'>
                <a href="https://www.adrenalin-ua.com/snig" onMouseOver={this.replayGif} onMouseOut={this.replayGif} target="_blank">
                  <img id='adrenalin' src="/images/Adrenalin_UA.gif" />
                </a>
              </div>
            </div>
          </div>
        </div>
        { this.state.hotel.lat &&
          <div className="map">
            <Map id='mapid' center={[this.state.hotel.lat, this.state.hotel.lng]} zoom={17}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
              />
              <Marker position={[this.state.hotel.lat, this.state.hotel.lng]}>
              </Marker>
            </Map>
          </div>}
        <div className='nearbys'>
          <span><strong><b>Заклади в радіусі 100 метрів</b></strong></span>
          <div id='hotels_ul'>
            { this.state.nearbyHotels.map((hotel, index) => {
              return (
                <div className='hotel' key={index}>
                  <div className="card">
                    <div className="card-img">
                      { hotel.avatar &&
                      <a href={`/hotels/${hotel.slug}`} className="image-popup fh5co-board-img"
                         title={hotel.name}><img src={hotel.avatar} alt={hotel.name}/></a>}
                    </div>
                    <div className="card-body">
                      <div className='body-top'>
                        <a href={`/hotels/${hotel.slug}`}><h1>{hotel.name}</h1></a>
                        <span>{hotel.price} {hotel.price && 'UAH'}</span>
                      </div>
                      <div className='body-bottom'>
                        <Rater initialRating={parseFloat(hotel.googleRating)} emptySymbol="fa fa-star-o"
                               fullSymbol="fa fa-star" readonly className='hotel-stars'/>
                        {hotel.location && <a className='3d-link' href={hotel.location} target="_blank">3D карта</a>}
                      </div>
                      <div className='body-bottom'>
                        <div className='icons'>
                          { hotel.sauna &&
                          <Fragment>
                            <img id={`Sauna-${index}`} src="/images/sauna.svg"/>
                            <Tooltip placement="bottom" isOpen={this.state.tooltips[index] && this.state.tooltips[index].sauna} target={`Sauna-${index}`} toggle={() => this.toggle(index, 'sauna')}>
                              Баня
                            </Tooltip>
                          </Fragment>}
                          { hotel.chan &&
                          <Fragment>
                            <img id={`Chan-${index}`} src="/images/chan.png"/>
                            <Tooltip placement="bottom" isOpen={this.state.tooltips[index] && this.state.tooltips[index].chan} target={`Chan-${index}`} toggle={() => this.toggle(index, 'chan')}>
                              Чан
                            </Tooltip>
                          </Fragment>}
                          { hotel.disco &&
                          <Fragment>
                            <img id={`Disco-${index}`} src="/images/disco.svg"/>
                            <Tooltip placement="bottom" isOpen={this.state.tooltips[index] && this.state.tooltips[index].disco} target={`Disco-${index}`} toggle={() => this.toggle(index, 'disco')}>
                              Дискотека
                            </Tooltip>
                          </Fragment>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>)})}
          </div>
        </div>
        <div className='reviews-wrap'>
          <div className='review-form'>
            <textarea type='text' rows='3' placeholder={this.state.logged ? 'Напишіть відгук про готель тут' : 'Щоб залишити відгук, потрібно зайти на сайт під своїм логіном або зареєструватися'}
                      onChange={(e) => this.handleInputChange('review', e.target.value)} value={this.state.review || ''} className='form-control'/>
            <div className='review-actions'>
              <button className='btn btn-dark' onClick={this.submitReview} disabled={this.state.reviewRating == 0}>Залишити відгук</button>
              <Rater start={0} stop={5} step={1} onClick={(rate) => this.handleInputChange('reviewRating', rate)} emptySymbol="fa fa-star-o fa-2x"
                     fullSymbol="fa fa-star fa-2x" className='hotel-stars' initialRating={this.state.reviewRating}/>
            </div>
          </div>
          <hr/>
          <div className='reviews'>
            { this.state.hotel.googleReviews.map((review, i) => {
              return (
                <Fragment key={i}>
                  <div className='review'>
                    <div className={ review.id ? 'round-image-200' : 'review-avatar-div' }><img className='review-avatar' src={review.avatar} alt={review.author} /></div>
                    <div className='review-content'>
                      <div className='content-top'>
                        <div className='left'>
                          <span className='author'>{review.author}</span>
                          <span className='date'>{review.created}</span>
                          { !review.reply && this.state.owner && <button className='btn btn-sm btn-outline-danger' onClick={() => this.showReplyForm(review.id)}>Відповісти</button>}
                        </div>
                        <div className='right'>
                          <Rater initialRating={parseInt(review.rating, 10)} emptySymbol="fa fa-star-o"
                                 fullSymbol="fa fa-star" readonly className='hotel-stars'/>
                          { review.destroyable && <i className='fa fa-trash-o' onClick={() => this.deleteReview(review.id)}/>}
                        </div>
                      </div>
                      <div className='review-body'>
                        {review.text}
                        { this.state.replyForms[review.id] &&
                          <div className='reply'>
                            <div className='review-content'>
                              <div className='review-body'>
                                <input type="text" className='form-control' value={this.state.reply} onChange={(e) => this.handleInputChange('reply', e.target.value)} />
                                <button className='btn btn-sm btn-danger float-right mt-3' onClick={() => this.submitReply(review.id, review.google)}>Надіслати</button>
                              </div>
                            </div>
                          </div>}
                        { review.reply &&
                          <div className='reply'>
                            { review.reply.destroyable && <i className='fa fa-trash-o' onClick={() => this.deleteReply(review.reply.id)}/>}
                            <div className='round-image-30'><img src={review.reply.avatar} alt={review.reply.author} /></div>
                            <div className='review-content'>
                              <div className='content-top'>
                                <span className='author'>{review.reply.author}</span>
                              </div>
                              <div className='review-body'>
                                {review.reply.body}
                              </div>
                            </div>
                          </div>}
                      </div>
                    </div>
                  </div>
                  <hr/>
                </Fragment>
              )})}
          </div>
        </div>
        { this.state.showSuggestForm &&
          <Modal isOpen={this.state.showSuggestForm} toggle={() => this.handleModal('showSuggestForm')} size="lg">
            <h4 className='text-center'>Запропонуйте щось від себе</h4>
            <div className='form-group'>
              <label>Ваш Email (необов'язкове поле)</label>
              <input type="email" className='form-control' value={this.state.suggestEmail} onChange={(e) => this.handleInputChange('suggestEmail', e.target.value)}/>
            </div>
            <div className='form-group'>
              <label>Опис проблеми</label>
              <textarea className='form-control' value={this.state.suggestBody || ''} placeholder="Опишіть тут проблему з якою Ви зіткнулися або запропонуйте свої зміни" onChange={(e) => this.handleInputChange('suggestBody', e.target.value)}/>
            </div>
            <div className='form-group'>
              <button disabled={this.state.suggestBody.length < 1} className='btn btn-block btn-danger' onClick={this.submitSuggest}>Надіслати</button>
            </div>
          </Modal>}
        { this.state.bookingModal &&
          <Modal isOpen={this.state.bookingModal} toggle={() => this.handleModal('bookingModal')}>
            <ModalHeader className='text-center' toggle={() => this.handleModal('bookingModal')}>
              { this.state.logged ?
                <Fragment>
                  { this.state.hotel.autoBooking ?
                    <Fragment>
                      { this.state.availableRooms.length < 1 ?
                        <Fragment>Виберіть дати</Fragment>
                        :
                        <span className='additional-info'>
                          Після бронювання Вам буде надіслано лист на електронну пошту з деталями бронювання.
                          Також після бронювання Ви можете передзвонити в готель та повідомити, що Ви забронювали номер на
                          сайті DRAGOBRAT.NET
                        </span>}
                    </Fragment>
                    :
                    <Fragment>
                      {this.state.availableRooms.length < 1 ?
                        <Fragment>Виберіть дати</Fragment>
                        :
                        <span className='additional-info'>
                          <span className='red'>УВАГА!</span> Ваше бронювання <span className='red'>буде перевірено</span> адміністратором готеля.
                          Ми надішлемо Вам лист як тільки адміністратор перевірить Ваш запит. Ви також можете передзвонити
                          в готель та повідомити, що Ви надіслали запит на бронювання на сайті DRAGOBRAT.NET
                        </span>}
                    </Fragment>}
                </Fragment>
                :
                <Fragment>
                  { this.state.availableRooms.length < 1 ?
                    <span className='additional-info'>
                      <span className='red'>УВАГА!</span> Ви не увійшли на сайт під власним логіном, але Ви всерівно можете <span className='red'>продовжити</span> бронювання.
                      Залоговані користувачі отримують листи на електронну пошту про статус бронювання та бронювання є видимим у кабінеті. Реєстрація займає 30 секунд.
                      Тому якщо Ви маєте бажання отримувати інформацію від нашого сайту, просимо перейти на сторінку реєстрації/входу.
                    </span>
                    :
                    <Fragment>
                      { this.state.hotel.autoBooking ?
                        <span className='additional-info'>
                          Після бронювання Ви можете передзвонити в готель та повідомити, що Ви забронювали номер на сайті DRAGOBRAT.NET
                        </span>
                        :
                        <span className='additional-info'>
                          <span className='red'>УВАГА!</span> Ваше бронювання <span className='red'>буде перевірено</span> адміністратором готеля.
                          Після бронювання Ви можете передзвонити в готель та повідомити, що Ви надіслали запит на бронювання на сайті DRAGOBRAT.NET
                        </span>}
                    </Fragment>}
                </Fragment>}
            </ModalHeader>
            <div className='reservation-form'>
              <div className='form-group'>
                <label>Дати</label>
                <AirBnbPicker
                  getBlockedDates={this.getBlockedDates}
                  hotelId={this.state.hotelId}
                  onPickerApply={this.handleNewReservationDateChange}
                  startDate={this.state.reservation.startDate}
                  endDate={this.state.reservation.endDate}
                  isDayBlocked={isDayBlocked}/>
              </div>
              { this.state.reservation.startDate && this.state.reservation.endDate && this.state.availableRooms.length < 1 &&
                <div className='no-rooms'>
                  Немає вільних номерів на ці дати
                </div>}
              { this.state.availableRooms.length > 0 &&
                <Fragment>
                  <div className='form-group'>
                    <label>Вільні номери: {this.state.availableRooms.length}</label>
                    <select className='form-control' value={this.state.reservation.roomId} onChange={(e) => this.handleNewReservationChange('roomId', e.target.value)}>
                      { this.state.availableRooms.map((room, i) =>
                        <option key={i} value={room.id}>Поверх {room.floor} | Номер {room.number} | Місць: {room.places} { room.bigBed && '| Двоспальне ліжко'}</option>
                      )}
                    </select>
                  </div>
                  <div className='form-group'>
                    <label>Ім'я</label>
                    <input type='text' className='form-control' value={this.state.reservation.name} onChange={(e) => this.handleNewReservationChange('name', e.target.value)} />
                  </div>
                  <div className='form-group'>
                    <label>Телефон</label>
                    <input type='tel' className='form-control' value={this.state.reservation.phone} onChange={(e) => this.handleNewReservationChange('phone', e.target.value)} />
                  </div>
                  <div className='form-group'>
                    <label>Додаткова інформація</label>
                    <textarea type='text' className='form-control' value={this.state.reservation.description || ''} onChange={(e) => this.handleNewReservationChange('description', e.target.value)} />
                  </div>
                </Fragment>}
            </div>
            <ModalFooter>
              <button disabled={!this.state.reservation.name} className='btn btn-block btn-outline-info reservation-btn' onClick={this.handleSubmitReservation}>Забронювати</button>
            </ModalFooter>
          </Modal>}
      </div>
    );
  }
}
