require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectat'))
  .catch((err) => console.log('Eroare MongoDB:', err));

// ---------- Utilizatori ----------
const utilizatorSchema = new mongoose.Schema(
  {
    nume: String,
    email: String,
    parola: String,
    rol: String,
    adresa: String,
    telefon: String,
    varsta: Number,
  },
  { collection: 'utilizators', timestamps: true }
);
const Utilizator = mongoose.model('Utilizator', utilizatorSchema);

// ---------- Medici ----------
const medicSchema = new mongoose.Schema({}, { strict: false, collection: 'medics' });
const Medic = mongoose.model('Medic', medicSchema);

// ---------- Login ----------
app.post('/api/login', async (req, res) => {
  try {
    const { email, parola, rol } = req.body;
    console.log('Login primit:', email, rol);

    if (!email || !parola) {
      return res.status(400).json({ message: 'Completează toate câmpurile.' });
    }

    const user = await Utilizator.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Utilizatorul nu există.' });
    }

    // Acceptă și parole hash-uite (bcrypt), și parole în text simplu
    const stocata = String(user.parola);
    const ok = stocata.startsWith('$2')
      ? await bcrypt.compare(parola, stocata)
      : stocata === parola;

    if (!ok) {
      return res.status(401).json({ message: 'Parolă incorectă.' });
    }

    if (rol && user.rol && user.rol.toLowerCase() !== rol.toLowerCase()) {
      return res.status(403).json({ message: `Acest cont nu este de tip ${rol}.` });
    }

    res.json({
      message: 'Login reușit',
      user: { nume: user.nume, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.log('EROARE LOGIN:', err);
    res.status(500).json({ message: 'Eroare de server', detalii: err.message });
  }
});

// ---------- Lista de medici ----------
app.get('/api/medici', async (req, res) => {
  try {
    const medici = await Medic.find().lean();
    if (medici[0]) console.log('Exemplu medic:', medici[0]);
    res.json(medici);
  } catch (err) {
    console.log('EROARE MEDICI:', err);
    res.status(500).json({ message: 'Eroare de server', detalii: err.message });
  }
});

app.listen(5001, '0.0.0.0', () => console.log('Server pornit pe portul 5001'));