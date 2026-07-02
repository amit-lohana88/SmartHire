const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const savedJobsRoutes = require('./routes/savedJobsRoutes');
const skillRoutes = require('./routes/skillRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const companyAnalyticsRoutes = require('./routes/companyAnalyticsRoutes');
const candidateDatabaseRoutes = require('./routes/candidateDatabaseRoutes');
const companySettingsRoutes = require('./routes/companySettingsRoutes');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json({ message: 'SmartHire API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved-jobs', savedJobsRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/analytics', companyAnalyticsRoutes);
app.use('/api/candidate-database', candidateDatabaseRoutes);
app.use('/api/company-settings', companySettingsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});