import ReactOnRails from 'react-on-rails';

import Hotels from '../components/Hotels/Hotels';
import Hotel from '../components/Hotels/Hotel';
import HotelNew from '../components/Hotels/HotelNew';
import HotelEdit from '../components/Hotels/HotelEdit';
import Schema from '../components/Schema';
import Reservations from '../components/Reservations';
import Rooms from '../components/Rooms';
import Room from '../components/Rooms/Room';
import ReservationList from '../components/Reservations/ReservationList';
import PendingReservations from '../components/Reservations/PendingReservations';
import UserReservations from '../components/Reservations/UserReservations';
import Chess from '../components/Reservations/Chess';

// This is how react_on_rails can see the HelloWorld in the browser.
ReactOnRails.register({
  Hotels,
  HotelNew,
  HotelEdit,
  Hotel,
  Schema,
  Reservations,
  Rooms,
  Room,
  ReservationList,
  PendingReservations,
  UserReservations,
  Chess
});
