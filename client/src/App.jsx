
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from 'react-router';

import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import GamePage from './pages/GamePage';
import GameSummaryPage from './pages/GameSummaryPage';
import DemoPage from './pages/DemoPage';
import NotFound from './pages/NotFound';

import API from "./API/API.mjs"

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const user = await API.getUserInfo(); // we have the user info here
      setLoggedIn(true);
      setUser(user);
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setMessage({msg: `Welcome, ${user.name}!`, type: 'success'});
      setUser(user);
    }catch(err) {
      setMessage({msg: err, type: 'danger'});
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setMessage('');
  };

    /**
    /                     => HomePage (benvenuto, login, istruzioni, demo)
    /login                => AuthPage
    /profile              => ProfilePage (cronologia partite, logout)
    /game                 => GamePage (gioco single player, solo utenti loggati)
    /game/summary         => GameSummaryPage (riepilogo dopo partita)
    /demo                 => DemoPage (gioco demo, 1 round, solo anonimi)
    *                    => NotFound
    **/

  return (    
      <Routes>
        <Route element={ <LayoutPage loggedIn={loggedIn} handleLogout={handleLogout} message={message} setMessage={setMessage} /> } ></Route>
        <Route path="/" element={<HomePage />} />
        <Route path='/login' element={loggedIn ? <Navigate replace to='/' /> : <LoginForm handleLogin={handleLogin} />} />       
        <Route path="/profile" element={ loggedIn ? <Profile loggedIn={loggedIn} user={user} stato={stato} setStato={setStato}/> :  <LoginForm login={handleLogin} user={user} profile={true}/>} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/game/summary" element={<GameSummaryPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

export default App;
