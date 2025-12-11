import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';


const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://URI', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Item = mongoose.model('Item', { name: String });

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
});

app.get('/api/items', async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

app.post('/api/items', async (req, res) => {
  const newItem = new Item({ name: req.body.name });
  await newItem.save();
  res.json(newItem);
});

app.listen(5000, () => {
  console.log('Backend running on port 5000');
});
