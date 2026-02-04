
import './index.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await axios.get('/api/items');
    setItems(res.data);
  };

  const addItem = async () => {
    await axios.post('/api/items', { name });
    setName('');
    fetchItems();
  };

  return (
<div className="app-container">
      <h1>MERN DevOps Demo</h1>
      <div className="form">
        <input
          type="text"
          placeholder="Enter item"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={addItem}>Add Item</button>
      </div>
      <ul className="item-list">
        {items.map((item) => (
          <li key={item._id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;

