import React, {Fragment} from 'react';
import Rater from 'react-rating'
import ReactGA from 'react-ga';
import ReactPixel from 'react-facebook-pixel';
import Masonry from 'react-masonry-css';
import { Tooltip, Modal, ModalHeader, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import Leaflet from 'leaflet';
import { Map, Marker, Popup, TileLayer, GeoJSON } from 'react-leaflet';
import InputRange from 'react-input-range';
import Chat from "../common/Chat";

export default class Hotels extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showChat: false,
      hotels: this.props.hotels,
      nameSearch: '',
      ratingSearch: '',
      dropdownOpen: false,
      sortTypeOpen: false,
      sortOrderOpen: false,
      sortType: '',
      sortOrder: '',
      admin: this.props.admin,
      tooltips: {},
      price: {
        min: this.props.minPrice,
        max: this.props.maxPrice
      }
    };
  }

  componentDidMount() {
    if (!this.state.admin) {
      ReactPixel.init('668734460178473');
      ReactGA.initialize('UA-116820611-2');
      ReactGA.ga('send', 'pageview', `/hotels`);
      ReactPixel.pageView();
    }
  }

  handleSearch = (field, value) => {
    this.setState({[field]: value})
  };

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
  };

  handleModal = () => {
    this.setState({
      showMap: !this.state.showMap
    });
  };

  toggleDropdown = (type) => {
    this.setState({
      [type]: !this.state[type]
    });
  };

  render() {
    console.log(this.state);
    let hotels = this.state.hotels.filter(h => h.name.toLowerCase().includes(this.state.nameSearch.toLowerCase()))
      .filter(h => parseFloat(h.googleRating) >= parseFloat(this.state.ratingSearch ? this.state.ratingSearch : 0))
    if (!this.props.cafe) {
      hotels = hotels.filter(h => parseFloat(h.price ? h.price : 999999) >= parseFloat(this.state.price.min))
        .filter(h => parseFloat(h.price ? h.price : 0) <= parseFloat(this.state.price.max))
        .filter(h => this.state.sauna ? h.sauna : h).filter(h => this.state.chan ? h.chan : h).filter(h => this.state.disco ? h.disco : h)
    }
    hotels = hotels.sort((a, b) => (this.state.sortType ? this.state.sortType === 'googleRating' ? (((this.state.sortType === 'googleRating' && this.state.sortOrder === 'increasing') ?
      parseFloat(a.googleRating) - parseFloat(b.googleRating) : (parseFloat(b.googleRating) - parseFloat(a.googleRating)))) : parseFloat(a.position) - parseFloat(b.position) : parseFloat(a.position) - parseFloat(b.position)));
    if (this.state.sortType === 'price') {
      hotels = hotels.sort((a, b) => (this.state.sortType && this.state.sortType === 'price' ? (((this.state.sortType === 'price' && this.state.sortOrder === 'increasing') ?
        (parseFloat(a.price) - parseFloat(b.price)) : (parseFloat(b.price) - parseFloat(a.price)))) : parseFloat(a.position) - parseFloat(b.position)))
    }
    return (
      <div className="whole-page">
        <div className={this.props.cafe ? 'top-page restaurants' : 'top-page'}>
          <div className='container'>
            {/*<div className="top-banners">*/}
            {/*  <a id='left-ads' href="https://dragobrat-freeride.com.ua/ua/" target="_blank"><img src="/images/freeride-yarema.jpg" /></a>*/}
            {/*  <a className='mobile' href="/skipass"><img src="/images/december_square.jpg" /></a>*/}
            {/*  <a className='wide' href="/skipass"><img src="/images/december_fb_header.jpg" /></a>*/}
            {/*</div>*/}
            {/*<div className='introduction'>*/}
              {/*/!*<p>Основою цього сайту є <strong><b>Google Maps API</b></strong>. Готелі, кафе, фото та відгуки до них автоматично оновлюються разом з тим, що є на Google картах. Місцезнаходження закладів*!/*/}
                {/*/!*можна подивитися на <strong><b>3D карті</b></strong>. До кожного готелю можна подивитися заклади, які знаходяться поблизу. Готелі, які присутні на <strong><b>Booking.com</b></strong> також показуються на цьому сайті. Якщо Ваш заклад відсутній на сайті,*!/*/}
                {/*/!*то Ви можете його створити в меню "Додати заклад" (потрібна реєстрація на сайті, яка займає 1 хвилину), або зв'язатися зі мною: sergykoretsfsp@gmail.com</p>*!/*/}
            {/*</div>*/}
            <div className='form-group'>
              <div className='row'>
                <div className='col-lg-4 filters'>
                  <div className='labels'>
                    { !this.props.cafe ? <label onClick={() => this.handleChat()}>Готель</label> : <label>Кафе</label>}
                    <ButtonDropdown isOpen={this.state.sortTypeOpen} toggle={() => this.toggleDropdown('sortTypeOpen')}>
                      <DropdownToggle caret>
                        {this.state.sortType === 'googleRating' && 'За рейтингом'}
                        {this.state.sortType === 'price' && 'За ціною'}
                        {this.state.sortType === '' && 'Сортування'}
                      </DropdownToggle>
                      <DropdownMenu>
                        <DropdownItem onClick={() => this.handleSearch('sortType', '')}>Не сортувати</DropdownItem>
                        <DropdownItem onClick={() => this.handleSearch('sortType', 'googleRating')}>За рейтингом</DropdownItem>
                        { !this.props.cafe && <DropdownItem onClick={() => this.handleSearch('sortType', 'price')}>За ціною</DropdownItem>}
                      </DropdownMenu>
                    </ButtonDropdown>
                    <ButtonDropdown isOpen={this.state.sortOrderOpen} toggle={() => this.toggleDropdown('sortOrderOpen')}>
                      <DropdownToggle caret>
                        {this.state.sortOrder === 'increasing' && 'За зростанням'}
                        {this.state.sortOrder === 'decreasing' && 'За спаданням'}
                        {this.state.sortOrder === '' && 'Порядок'}
                      </DropdownToggle>
                      <DropdownMenu>
                        <DropdownItem onClick={() => this.handleSearch('sortOrder', '')}>Стандартний</DropdownItem>
                        <DropdownItem onClick={() => this.handleSearch('sortOrder', 'increasing')}>За зростанням</DropdownItem>
                        <DropdownItem onClick={() => this.handleSearch('sortOrder', 'decreasing')}>За спаданням</DropdownItem>
                      </DropdownMenu>
                    </ButtonDropdown>
                  </div>
                  <input type='text' placeholder='Пошук по назві закладу' className='form-control' onChange={(e) => this.handleSearch('nameSearch', e.target.value)} value={this.state.nameSearch} />
                  { !this.props.cafe &&
                    <Fragment>
                      <div className='labels'>
                        <div className='custom-checkbox'>
                          <input type='checkbox' id="sauna" onChange={(e) => this.handleSearch('sauna', !this.state.sauna)} checked={this.state.sauna} />
                          <label className='activities' htmlFor="sauna">Баня</label>
                        </div>
                        <div className='custom-checkbox'>
                          <input type='checkbox' id="chan" onChange={(e) => this.handleSearch('chan', !this.state.chan)} checked={this.state.chan} />
                          <label className='activities' htmlFor="chan">Чан</label>
                        </div>
                        <div className='custom-checkbox'>
                          <input type='checkbox' id="disco" onChange={(e) => this.handleSearch('disco', !this.state.disco)} checked={this.state.disco} />
                          <label className='activities' htmlFor="disco">Диско</label>
                        </div>
                      </div>
                    </Fragment>}
                </div>
                { !this.props.cafe &&
                  <div className='col-lg-3'>
                    <label>Ціна</label>
                    <ButtonDropdown className='form-control' isOpen={this.state.dropdownOpen} toggle={() => this.toggleDropdown('dropdownOpen')}>
                      <DropdownToggle color='white' caret>
                        {`${this.state.price.min} - ${this.state.price.max} UAH`}
                      </DropdownToggle>
                      <DropdownMenu className='price-dropdown'>
                        <InputRange
                          maxValue={this.props.maxPrice + 50}
                          minValue={0}
                          step={10}
                          value={this.state.price}
                          onChange={value => this.setState({ price: value })} />
                      </DropdownMenu>
                    </ButtonDropdown>
                  </div>}
                <div className='col-lg-3 filters'>
                  <label>Рейтинг</label>
                  <select className='form-control' onChange={(e) => this.handleSearch('ratingSearch', e.target.value)} value={this.state.ratingSearch} >
                    <option value={0}>Фільтр по рейтингу</option>
                    <option value={1}>Рейтинг вище 1</option>
                    <option value={2}>Рейтинг вище 2</option>
                    <option value={3}>Рейтинг вище 3</option>
                    <option value={3.5}>Рейтинг вище 3.5</option>
                    <option value={4}>Рейтинг вище 4</option>
                    <option value={4.5}>Рейтинг вище 4.5</option>
                  </select>
                </div>
                <div className='col-lg-2'>
                  <label>Карта</label>
                  <button onClick={this.handleModal} className='btn map-btn'>{hotels.length} шт</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='container'>
          <Masonry breakpointCols={{default: 4, 1199: 3, 991: 2, 767: 1}}>
            { hotels.map((hotel, index) => {
              return (
                <div key={index} className="hotel">
                  <div className="card">
                    <div className="card-img">
                      { hotel.avatar &&
                      <a href={`/hotels/${hotel.slug}`} className="image-popup fh5co-board-img"
                         title={hotel.name}><img src={hotel.avatar || '/images/missing.jpg'} alt={hotel.name}/></a>}
                    </div>
                    <div className="card-body">
                      <div className='body-top'>
                        <a href={`/hotels/${hotel.slug}`}><h1>{hotel.name}</h1></a>
                        { hotel.price &&
                          <Fragment>
                            <span>
                              <span className='hotel-price'>{hotel.price} UAH</span>
                              <i className="fa fa-info-circle" id={`TooltipExample${index}`}></i>
                            </span>
                            <Tooltip placement="bottom" isOpen={this.state.tooltips[index] && this.state.tooltips[index].price} target={`TooltipExample${index}`} toggle={() => this.toggle(index, 'price')}>
                               Мінімальна ціна з людини за 1 ніч
                            </Tooltip>
                          </Fragment>}
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
                        { hotel.allowBooking &&
                          <Fragment>
                            <button id={`Booking-${index}`} className='btn btn-xs btn-warning'>Online</button>
                            <Tooltip placement="bottom" isOpen={this.state.tooltips[index] && this.state.tooltips[index].booking} target={`Booking-${index}`} toggle={() => this.toggle(index, 'booking')}>
                              Цей готель можна бронювати Online
                            </Tooltip>
                          </Fragment>}
                      </div>
                    </div>
                  </div>
                </div>
              )
              })}
          </Masonry>
        </div>
        { this.state.showMap &&
          <Modal isOpen={this.state.showMap} toggle={this.handleModal} size="lg">
            <ModalHeader className='text-center'  toggle={this.handleModal}>Карта</ModalHeader>
            <Map id='full-map' center={[48.247, 24.242]} zoom={16}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
              />
              { hotels.map((hotel, i) => {
                if (hotel.lat) {
                  return (
                    <Marker key={i} position={[hotel.lat, hotel.lng]}>
                      <Popup>
                        <a href={`/hotels/${hotel.slug}`}>{hotel.name}</a><br/>
                        {hotel.price && !this.props.cafe && <Fragment><span>Ціна: {hotel.price} UAH</span><br/></Fragment>}
                        <span>Рейтинг: {hotel.googleRating}/5</span><br/>
                        <a href={hotel.location} target="_blank">3D карта</a>
                      </Popup>
                    </Marker>
                  )}})}
            </Map>
          </Modal>}
      </div>
    );
  }
}
