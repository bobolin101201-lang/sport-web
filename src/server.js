'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
const fsPromises = fs.promises;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      cb(
        null,
        [
          'activity',
          req.userId || 'guest',
          Date.now(),
          Math.round(Math.random() * 1000)
        ].join('-') + path.extname(file.originalname || '')
      );
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB photo limit
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    cb(null, true);
  }
});

// In-memory stores for quick prototyping; replace with a database later.
const usersByUsername = new Map();
const usersById = new Map();
const sessions = new Map();
const activitiesByUser = new Map();

const deletePhotoFile = async (photoUrl) => {
  if (!photoUrl) {
    return;
  }
  const filename = path.basename(photoUrl);
  if (!filename) {
    return;
  }
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to remove photo', error);
    }
  }
};

const cleanupUploadedFile = (req) => {
  if (req.file) {
    deletePhotoFile(`/uploads/${req.file.filename}`);
  }
};

const seedUser = {
  id: 'user-1',
  username: 'athlete',
  password: '123456',
  displayName: 'Athlete Demo'
};
usersByUsername.set(seedUser.username, seedUser);
usersById.set(seedUser.id, seedUser);
activitiesByUser.set(seedUser.id, [
  {
    id: 'seed-' + Date.now(),
    date: '2024-01-01',
    sport: 'Running',
    durationMinutes: 30,
    intensity: 'moderate',
    notes: 'Sample record you can remove.',
    photoUrl: '',
    isPublic: true,
    ownerId: seedUser.id,
    ownerName: seedUser.displayName,
    createdAt: new Date().toISOString()
  }
]);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const createSession = (userId) => {
  const token = `token-${userId}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  sessions.set(token, userId);
  return token;
};

const sanitizeUser = (user) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName
});

const parseBooleanFlag = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).toLowerCase();

  if (['true', '1', 'on', 'yes'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'off', 'no'].includes(normalized)) {
    return false;
  }

  return fallback;
};

// TODO: Integrate your preferred weather API inside this helper.
// Provide any required context (e.g., coordinates stored per user) via the parameter.
async function fetchWeatherForUser(_context) {
  /*
   * Example:
   * const response = await fetch('https://your-weather-api', { ... });
   * const data = await response.json();
   * return {
   *   location: data.location.name,
   *   temperatureC: data.current.temp_c,
   *   condition: data.current.condition.text,
   *   humidity: data.current.humidity / 100,
   *   windKph: data.current.wind_kph,
   *   lastUpdated: data.current.last_updated
   * };
   */
  return null;
}

app.post('/api/register', (req, res) => {
  const { username, password, displayName } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'username and password are required fields.' });
  }

  const normalizedUsername = String(username).trim();

  if (usersByUsername.has(normalizedUsername)) {
    return res.status(409).json({ error: 'Username already exists.' });
  }

  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 6 characters long.' });
  }

  const newUser = {
    id: `user-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    username: normalizedUsername,
    password: String(password),
    displayName: displayName?.trim() || normalizedUsername
  };

  usersByUsername.set(newUser.username, newUser);
  usersById.set(newUser.id, newUser);
  activitiesByUser.set(newUser.id, []);

  res.status(201).json({
    data: {
      user: sanitizeUser(newUser),
      message: 'Registration successful. Please log in.'
    }
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'username and password are required fields.' });
  }

  const normalizedUsername = String(username).trim();
  const match = usersByUsername.get(normalizedUsername);

  if (!match || match.password !== String(password)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  usersById.set(match.id, match);

  const token = createSession(match.id);

  res.json({
    data: {
      token,
      user: sanitizeUser(match)
    }
  });
});

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  req.userId = sessions.get(token);
  next();
};

app.get('/api/activities', requireAuth, (req, res) => {
  const userActivities = activitiesByUser.get(req.userId) ?? [];
  const normalized = userActivities.map((activity) => ({
    ...activity,
    isPublic: Boolean(activity.isPublic),
    ownerId: activity.ownerId || req.userId,
    ownerName:
      activity.ownerName ||
      usersById.get(req.userId)?.displayName ||
      usersById.get(req.userId)?.username ||
      '使用者',
    createdAt:
      activity.createdAt ||
      (activity.date ? new Date(activity.date).toISOString() : new Date().toISOString())
  }));

  res.json({ data: normalized });
});

app.get('/api/activities/public', requireAuth, (_req, res) => {
  const feed = [];

  for (const [, activityList] of activitiesByUser.entries()) {
    for (const activity of activityList) {
      if (activity.isPublic) {
        feed.push({
          ...activity,
          isPublic: true,
          createdAt:
            activity.createdAt ||
            (activity.date
              ? new Date(activity.date).toISOString()
              : new Date().toISOString())
        });
      }
    }
  }

  feed.sort((a, b) => {
    const aTime = new Date(a.createdAt || a.date).getTime();
    const bTime = new Date(b.createdAt || b.date).getTime();
    return bTime - aTime;
  });

  res.json({ data: feed });
});

app.get('/api/weather', requireAuth, async (req, res, next) => {
  try {
    const weather = await fetchWeatherForUser({ userId: req.userId });

    if (weather) {
      return res.json({ data: weather });
    }

    res.json({
      data: {
        summary: '天氣',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

const createActivity = (req, res) => {
  const { date, sport, durationMinutes, intensity, notes, isPublic } = req.body;

  if (!date || !sport || !durationMinutes) {
    cleanupUploadedFile(req);
    return res.status(400).json({
      error: 'date, sport, and durationMinutes are required fields.'
    });
  }

  const parsedDuration = Number(durationMinutes);
  if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
    cleanupUploadedFile(req);
    return res
      .status(400)
      .json({ error: 'durationMinutes must be a positive number.' });
  }

  const isPublicValue = parseBooleanFlag(isPublic, false);

  let photoUrl = '';
  if (req.file) {
    photoUrl = `/uploads/${req.file.filename}`;
  }

  const owner = usersById.get(req.userId);
  const ownerName = owner?.displayName || owner?.username || '使用者';

  const newActivity = {
    id: `activity-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    date,
    sport,
    durationMinutes: parsedDuration,
    intensity: intensity || 'moderate',
    notes: notes || '',
    photoUrl,
    isPublic: isPublicValue,
    ownerId: req.userId,
    ownerName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const userActivities = activitiesByUser.get(req.userId);
  if (!userActivities) {
    activitiesByUser.set(req.userId, [newActivity]);
  } else {
    userActivities.unshift(newActivity);
  }

  res.status(201).json({ data: newActivity });
};

app.post('/api/activities', requireAuth, (req, res, next) => {
  const isMultipart = req.headers['content-type']?.includes('multipart/form-data');

  if (!isMultipart) {
    return createActivity(req, res);
  }

  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Photo must be smaller than 5 MB.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }

    try {
      createActivity(req, res);
    } catch (error) {
      next(error);
    }
  });
});

const updateActivity = async (req, res) => {
  const { activityId } = req.params;
  const userActivities = activitiesByUser.get(req.userId);

  if (!userActivities) {
    cleanupUploadedFile(req);
    return res.status(404).json({ error: 'Activity not found.' });
  }

  const activity = userActivities.find((item) => item.id === activityId);

  if (!activity) {
    cleanupUploadedFile(req);
    return res.status(404).json({ error: 'Activity not found.' });
  }

  const { date, sport, durationMinutes, intensity, notes, isPublic } = req.body;

  if (!date || !sport || !durationMinutes) {
    cleanupUploadedFile(req);
    return res.status(400).json({
      error: 'date, sport, and durationMinutes are required fields.'
    });
  }

  const parsedDuration = Number(durationMinutes);
  if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
    cleanupUploadedFile(req);
    return res
      .status(400)
      .json({ error: 'durationMinutes must be a positive number.' });
  }

  const prevPhotoUrl = activity.photoUrl;
  if (req.file) {
    activity.photoUrl = `/uploads/${req.file.filename}`;
  }

  activity.date = date;
  activity.sport = sport;
  activity.durationMinutes = parsedDuration;
  activity.intensity = intensity || activity.intensity || 'moderate';
  activity.notes = notes !== undefined ? notes : activity.notes || '';
  activity.isPublic = parseBooleanFlag(isPublic, activity.isPublic);
  activity.updatedAt = new Date().toISOString();

  if (req.file && prevPhotoUrl && prevPhotoUrl !== activity.photoUrl) {
    await deletePhotoFile(prevPhotoUrl);
  }

  res.json({ data: activity });
};

app.put('/api/activities/:activityId', requireAuth, (req, res, next) => {
  const isMultipart = req.headers['content-type']?.includes('multipart/form-data');

  if (!isMultipart) {
    updateActivity(req, res).catch(next);
    return;
  }

  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Photo must be smaller than 5 MB.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }

    updateActivity(req, res).catch(next);
  });
});

app.delete('/api/activities/:activityId', requireAuth, async (req, res) => {
  const { activityId } = req.params;
  const userActivities = activitiesByUser.get(req.userId);

  if (!userActivities) {
    return res.status(404).json({ error: 'Activity not found.' });
  }

  const index = userActivities.findIndex((item) => item.id === activityId);

  if (index === -1) {
    return res.status(404).json({ error: 'Activity not found.' });
  }

  const [removed] = userActivities.splice(index, 1);

  if (removed?.photoUrl) {
    await deletePhotoFile(removed.photoUrl);
  }

  res.json({ data: { id: activityId } });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  // Log and return a generic error to keep response consistent.
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`Sports tracker listening on http://localhost:${PORT}`);
});
