const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

const DOCS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR);
app.use('/uploads', express.static(DOCS_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'license' ? 'license' : 'criminal';
    cb(null, `${prefix}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, or PDF files are allowed.'));
  },
});

const users = [
  { id: 1, username: 'yaren.kaya@stu.ege.edu.tr', password: '123', name: 'Yaren Kaya', role: 'renter', university: 'Ege Üniversitesi', documents: { license: null, criminalRecord: null } },
  { id: 2, username: 'cagri.kaya@stu.yasar.edu.tr', password: '123', name: 'Çağrı Kaya', role: 'owner', university: 'Yaşar Üniversitesi', documents: { license: null, criminalRecord: null } },
  { id: 3, username: 'admin@yasar.edu.tr', password: 'admin', name: 'Admin', role: 'admin', university: 'Yaşar Üniversitesi', documents: { license: null, criminalRecord: null } },
];

const tokens = {};

const roleLabel = (role) =>
  role === 'owner' ? 'Araç Sahibi' : role === 'renter' ? 'Kiracı' : 'Admin';

app.post(
  '/api/register',
  upload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'criminalRecord', maxCount: 1 },
  ]),
  (req, res) => {
    const { username, password, name, role, university } = req.body;

    if (!username || !password || !name || !role || !university) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!['renter', 'owner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'This email address is already registered.' });
    }
    if (!req.files?.license) {
      return res.status(400).json({ error: "Driver's license document is required." });
    }
    if (!req.files?.criminalRecord) {
      return res.status(400).json({ error: 'Criminal record document is required.' });
    }

    const licenseUrl = `http://localhost:3001/uploads/${req.files.license[0].filename}`;
    const criminalUrl = `http://localhost:3001/uploads/${req.files.criminalRecord[0].filename}`;

    const newUser = {
      id: users.length + 1,
      username,
      password,
      name,
      role,
      university,
      documents: { license: licenseUrl, criminalRecord: criminalUrl },
    };
    users.push(newUser);

    const token = `token_${newUser.id}_${Date.now()}`;
    tokens[token] = newUser;
    const { password: _, ...safeUser } = newUser;
    console.log(`[UserService] ✓ Register → ${newUser.name} (${roleLabel(newUser.role)}) | License: ${req.files.license[0].filename} | Criminal: ${req.files.criminalRecord[0].filename}`);
    res.status(201).json({ token, user: safeUser });
  }
);

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    console.log(`[UserService] ✗ Failed login attempt → "${username}"`);
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  const token = `token_${user.id}_${Date.now()}`;
  tokens[token] = user;
  const { password: _, ...safeUser } = user;
  console.log(`[UserService] ✓ Login  → ${user.name} (${roleLabel(user.role)}) | Active sessions: ${Object.keys(tokens).length}`);
  res.json({ token, user: safeUser });
});

app.get('/api/verify', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ valid: false });
  const token = auth.replace('Bearer ', '');
  const user = tokens[token];
  if (!user) return res.status(401).json({ valid: false });
  const { password: _, ...safeUser } = user;
  res.json({ valid: true, user: safeUser });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

app.post('/api/logout', (req, res) => {
  const auth = req.headers.authorization;
  if (auth) {
    const token = auth.replace('Bearer ', '');
    const user = tokens[token];
    if (user) {
      delete tokens[token];
      console.log(`[UserService] ✓ Logout → ${user.name} | Active sessions: ${Object.keys(tokens).length}`);
    }
  }
  res.json({ success: true });
});

app.listen(3001, () => {
  const owners  = users.filter(u => u.role === 'owner').length;
  const renters = users.filter(u => u.role === 'renter').length;
  console.log('✅ User Service     → http://localhost:3001');
  console.log(`   ${users.length} users: ${owners} car owner(s), ${renters} renter(s)`);
});
