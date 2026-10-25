import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, COLORS } from '../constants/bookmed';

type Rol = 'pacient' | 'medic';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rol, setRol] = useState<Rol>('pacient');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Eroare', 'Te rog să completezi toate câmpurile.');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), parola: password, rol }),
        signal: controller.signal,
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (response.ok) {
        router.replace({
          pathname: '/(tabs)/home',
          params: { nume: data.user?.nume ?? '', rol },
        });
      } else {
        Alert.alert('Eroare', data.message || 'Date incorecte.');
      }
    } catch (error) {
      console.log('EROARE LOGIN:', error);
      Alert.alert('Eroare', 'Serverul nu răspunde. Verifică serverul și adresa.');
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const Casuta = ({ valoare, eticheta }: { valoare: Rol; eticheta: string }) => {
    const bifat = rol === valoare;
    return (
      <TouchableOpacity
        style={[styles.casuta, bifat && styles.casutaActiva]}
        onPress={() => setRol(valoare)}
        activeOpacity={0.85}>
        <View style={[styles.checkbox, bifat && styles.checkboxActiv]}>
          {bifat && <Text style={styles.bifa}>✓</Text>}
        </View>
        <Text style={[styles.casutaText, bifat && styles.casutaTextActiv]}>{eticheta}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoCircle}>
          <Text style={styles.logoCross}>✚</Text>
        </View>

        <Text style={styles.title}>BOOKMED</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>Programări medicale, simplu și rapid</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bine ai revenit</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, focused === 'email' && styles.inputFocused]}
            placeholder="nume@email.com"
            placeholderTextColor={COLORS.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />

          <Text style={styles.label}>Parolă</Text>
          <View style={[styles.passwordRow, focused === 'password' && styles.inputFocused]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showText}>{showPassword ? 'Ascunde' : 'Arată'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.roleLabel}>Te loghezi ca...</Text>
          <View style={styles.roleRow}>
            <Casuta valoare="pacient" eticheta="Pacient" />
            <Casuta valoare="medic" eticheta="Medic" />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Intră în cont</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© BookMED</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  circleTop: {
    position: 'absolute', top: -80, right: -60, width: 240, height: 240,
    borderRadius: 120, backgroundColor: '#F3DFC9', opacity: 0.7,
  },
  circleBottom: {
    position: 'absolute', bottom: -90, left: -70, width: 260, height: 260,
    borderRadius: 130, backgroundColor: '#F6E4D3', opacity: 0.8,
  },
  logoCircle: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
    shadowColor: COLORS.accentDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  logoCross: { fontSize: 34, color: '#FFFDF9' },
  title: {
    fontSize: 38, fontWeight: '300', letterSpacing: 10, color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', paddingLeft: 10,
  },
  divider: { width: 60, height: 2, backgroundColor: COLORS.accent, borderRadius: 2, marginVertical: 12 },
  tagline: { fontSize: 14, color: COLORS.muted, letterSpacing: 0.5, marginBottom: 30 },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: COLORS.card, borderRadius: 24, padding: 24,
    shadowColor: '#8B6B4A', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 13, color: COLORS.muted, marginBottom: 6, marginLeft: 4 },
  input: {
    height: 52, backgroundColor: COLORS.input, borderRadius: 14, paddingHorizontal: 16,
    marginBottom: 16, borderWidth: 1.5, borderColor: COLORS.inputBorder, color: COLORS.text, fontSize: 15,
  },
  inputFocused: { borderColor: COLORS.accent, backgroundColor: '#FBEFE1' },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center', height: 52, backgroundColor: COLORS.input,
    borderRadius: 14, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1.5, borderColor: COLORS.inputBorder,
  },
  passwordInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  showText: { color: COLORS.accentDark, fontSize: 13, fontWeight: '600' },
  roleLabel: { fontSize: 13, color: COLORS.muted, marginBottom: 8, marginLeft: 4 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  casuta: {
    flex: 1, flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.inputBorder, backgroundColor: COLORS.input, paddingHorizontal: 14,
  },
  casutaActiva: { borderColor: COLORS.accent, backgroundColor: '#FBEFE1' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.accent,
    backgroundColor: '#FFFDF9', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  checkboxActiv: { backgroundColor: COLORS.accent },
  bifa: { color: '#FFFDF9', fontSize: 14, fontWeight: '700' },
  casutaText: { fontSize: 15, color: COLORS.muted, fontWeight: '600' },
  casutaTextActiv: { color: COLORS.text },
  button: {
    height: 54, backgroundColor: COLORS.accent, borderRadius: 14, justifyContent: 'center',
    alignItems: 'center', shadowColor: COLORS.accentDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFDF9', fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  footer: { marginTop: 28, fontSize: 12, color: COLORS.muted },
});