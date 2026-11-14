const app = require('./app');

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
});