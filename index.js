const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const TOKEN = process.env.PRICE_API_TOKEN;

app.get('/', (req, res) => {
  res.send('Backend works!');
});

app.post('/priceapi', async (req, res) => {
  try {

    const ids = req.body.ids;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        error: 'ids must be array'
      });
    }

    // 1. Создаём job
    const createJobResponse = await axios.post(
      'https://api.priceapi.com/v2/jobs',
      {
        token: TOKEN,
        country: 'us',
        source: 'amazon',
        topic: 'product_and_offers',
        key: 'asin',
        max_age: 12000,
        max_pages: 1,
        values: ids,
      }
    );

    const jobId = createJobResponse.data.job_id;

    if (!jobId) {
      return res.status(500).json({
        error: 'job_id not found',
        data: createJobResponse.data,
      });
    }

    // 2. Ждём завершения job
    let status = '';
    let attempts = 0;

    while (status !== 'finished' && attempts < 30) {

      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await axios.get(
        `https://api.priceapi.com/v2/jobs/${jobId}`,
        {
          params: {
            token: TOKEN,
          },
        }
      );

      status = statusResponse.data.status;

      console.log(`Job status: ${status}`);

      if (status === 'failed') {
        return res.status(500).json({
          error: 'PriceAPI job failed',
        });
      }

      attempts++;
    }

    // 3. Скачиваем результат
    const downloadResponse = await axios.get(
      `https://api.priceapi.com/v2/jobs/${jobId}/download`,
      {
        params: {
          token: TOKEN,
        },
      }
    );

    res.json(downloadResponse.data);

  } catch (e) {

    console.log(e.response?.data || e.message);

    res.status(500).json({
      error: e.response?.data || e.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
