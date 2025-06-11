import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';

import HomePage from './components/HomePage';
import { LoginForm } from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import GamePage from './components/GamePage';
import GameSummaryPage from './components/GameSummaryPage';
import DemoPage from './components/DemoPage';
import NotFound from './components/NotFound';
import LayoutPage from './components/LayoutPage';

import API from '/API.mjs'; 
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
      } catch {
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
      setMessage({msg: `Welcome, ${user.name}!`, type: 'success'});
      setUser(user);
    } catch(err) {
      setMessage({msg: err, type: 'danger'});
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(null);
    setMessage(null);
  };

  return (
    <Routes>
        <Route element={<LayoutPage loggedIn={loggedIn} handleLogout={handleLogout} message={message} setMessage={setMessage}/>}>
            <Route path="/" element={<HomePage loggedIn={loggedIn} />} />
            <Route path="/login" element={loggedIn ? <Navigate replace to='/' /> : <LoginForm handleLogin={handleLogin}/>}/>
            <Route path="/profile" element={loggedIn ? <ProfilePage user={user} /> : <Navigate replace to="/login"/>} />

            <Route path="/game" element={loggedIn ? <GamePage user={user} /> : <Navigate replace to="/login"/>}/>

            <Route path="/game/summary" element={<GameSummaryPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="*" element={<NotFound />} />
        </Route>
    </Routes>
  );
}

export default App;
