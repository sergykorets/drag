import firebase from 'firebase';

const firebaseConfig = {
    apiKey: "AIzaSyDM5fHYOgKovob7679oLfv1LGTxRX9xllA",
    authDomain: "sergykorets-160911.firebaseapp.com",
    databaseURL: "https://sergykorets-160911.firebaseio.com",
    projectId: "sergykorets-160911",
    storageBucket: "sergykorets-160911.appspot.com",
    messagingSenderId: "979567235411",
    appId: "1:979567235411:web:2779e4401d73be0ef591a6",
    measurementId: "G-EHXFG52G8B"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

export default firebase;