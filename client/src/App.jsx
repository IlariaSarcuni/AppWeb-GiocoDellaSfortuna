import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from 'react-router';

import HomePage from './components/HomePage';
import { LoginForm } from './components/AuthPage';
import UserHistory from './components/UserHistory';
import GamePage from './components/GamePage';
import GameSummary from './components/GameSummary';
import DemoGame from './components/DemoGame';
import NotFound from './components/NotFound';
import LayoutPage from './components/LayoutPage';

import API from './API.mjs';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch (err) {
        setLoggedIn(false);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setUser(user);
      setMessage({msg: `Bentornata, ${user.name}!`, type: 'success'});
    }catch(err) {
      setMessage({msg: err, type: 'danger'});
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(null);
    setMessage('');
  };

  return (
    <Routes>
      <Route element={<LayoutPage loggedIn={loggedIn} handleLogout={handleLogout} message={message} setMessage={setMessage}/>}>
        <Route path="/" element={<HomePage loggedIn={loggedIn} />} />
        <Route path="/demo" element={<DemoGame />} />          
        <Route path="/game" element={loggedIn ? <GamePage user={user} /> : <Navigate replace to="/"/>} />  
        <Route path="summary" element={<GameSummary user={user} />} />
        <Route path="/history" element={loggedIn ? <UserHistory user={user} /> : <Navigate replace to="/"/>} />            
        <Route path="/login" element={loggedIn ? <Navigate replace to='/' /> : <LoginForm handleLogin={handleLogin}/>}/>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;