const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ВАЖНО: Имя должно совпадать с тем, что ты вписал в Render (TOKEN)
const TOKEN = process.env.TOKEN; 

app.get('/', (req, res) => {
  res.send('Backend works!');
});

app.post('/priceapi', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be array' });
    }

    console.log("Создаем задачу для ID:", ids);

    // 1. Создаём job
    const jobResponse = await axios.post("https://api.priceapi.com/v2/jobs", {
      token: TOKEN,
      source: 'amazon',
      country: 'us',
      topic: 'product_and_offers',
      key: 'asin',
      values: ids.join('\n')
    });

    const jobId = jobResponse.data.job_id; // Достаем ID задачи
    console.log(`Job создана: ${jobId}`);

    // 2. Ждём завершения job
    let status = '';
    let attempts = 0;

    while (status !== 'finished' && attempts < 30) {
      console.log(`Проверка статуса (${attempts})...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Ждем 2 секунды

      const statusResponse = await axios.get(
        `https://api.priceapi.com/v2/jobs/${jobId}`,
        { params: { token: TOKEN } }
      );

      status = statusResponse.data.status;
      console.log(`Текущий статус: ${status}`);

      if (status === 'failed') {
        return res.status(500).json({ error: 'PriceAPI job failed' });
      }
      attempts++;
    }

    if (status !== 'finished') {
      return res.status(500).json({ error: 'Timed out waiting for job' });
    }

    // 3. Скачиваем результат
    console.log("Загружаем результаты...");
    const downloadResponse = await axios.get(
      `https://api.priceapi.com/v2/jobs/${jobId}/download`,
      { params: { token: TOKEN } }
    );

    // Отправляем финальные данные во Flutter
    res.json(downloadResponse.data);

  } catch (e) {
    console.error("Ошибка:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
}); // Теперь скобка закрывается правильно в самом конце

const PORT = process.env.PORT || 10000; // Render любит порт 10000
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
