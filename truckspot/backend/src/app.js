const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { uploadRoot } = require('./middleware/upload');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.disableRateLimit,
  })
);

// Uploaded documents (RC, patente, carte grise) served as static files.
app.use(`/${env.uploadDir}`, express.static(uploadRoot, { maxAge: '1d' }));

app.use('/api', routes);
app.get('/', (req, res) => res.json({ name: 'TruckSpot API', version: '1.0.0', docs: '/api/health' }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
