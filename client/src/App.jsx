import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios';

function App() {
  const [count, setCount] = useState(0);
  const [array, setArray] = useState([]);

  const fetchAPI = async () => {
    const response = await axios.get("/api/users");
    console.log(response.data.users);
    setArray(response.data.users);
  };

  useEffect(() => {
    fetchAPI();
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 className='title'>Monitor</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
          {
            array.map((user, index) => (
              <div key={index}>
              <span>{user}</span>
              <br></br>
              </div>
          ))}
      </div>
      <p className="read-the-docs">
        This is the homepage. 
      </p>
    </>
  )
}

export default App
