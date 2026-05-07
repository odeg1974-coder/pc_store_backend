const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const TOKEN = process.env.PRICE_API_TOKEN;

// Проверка сервера
app.get('/', (req, res) => {
  res.send('Backend works!');
});

// Route для PriceAPI
app.post('/priceapi', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.priceapi.com/v2/jobs',
      {
        token: TOKEN,
        ...req.body,
      }
    );

    res.json(response.data);

  } catch (e) {

    console.log(e.response?.data || e.message);

    res.status(500).json({
      error: e.response?.data || e.message,
    });
  }
});

// Render сам выдаёт PORT
const PORT = process.env.PORT || 3000;

// ВАЖНО
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
