import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, COLORS } from '../../constants/bookmed';

type Medic = {
  id: string;
  nume: string;
  specialitate: string;
  locatie: string;
  pret?: number;
  rating?: number;
  reviewuri?: number;
  poza?: string;
  program?: string;
  zile?: string;
};

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const initiale = (nume: string) =>
  nume
    .replace(/^(dr\.?|doctor)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

const formatZile = (zile?: string[]) => {
  if (!Array.isArray(zile) || zile.length === 0) return '';
  return zile.length > 2 ? `${zile[0]} - ${zile[zile.length - 1]}` : zile.join(', ');
};

export default function HomeScreen() {
  const { nume } = useLocalSearchParams<{ nume?: string }>();
  const [medici, setMedici] = useState<Medic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eroare, setEroare] = useState('');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const incarcaMedici = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      setEroare('');
      const res = await fetch(`${API_URL}/api/medici`, { signal: controller.signal });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : [];
      if (!res.ok || !Array.isArray(data)) throw new Error('Răspuns invalid');

      setMedici(
        data.map((m: any) => ({
          id: String(m._id),
          nume: m.nume || 'Medic fără nume',
          specialitate: m.specialitate || '',
          locatie: m.locatie || '',
          pret: m.pretConsultatie,
          rating: m.rating,
          reviewuri: m.numarReviewuri,
          poza: m.poza,
          program: m.program?.oraStart ? `${m.program.oraStart} - ${m.program.oraSfarsit}` : '',
          zile: formatZile(m.program?.zileActive),
        }))
      );
    } catch (e) {
      console.log('EROARE MEDICI:', e);
      setEroare('Nu am putut încărca medicii. Verifică serverul și adresa.');
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    incarcaMedici();
  }, [incarcaMedici]);

  // specialitățile unice din baza de date
  const specialitati = useMemo(() => {
    const set = new Set<string>();
    medici.forEach((m) => m.specialitate && set.add(m.specialitate));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [medici]);

  const q = norm(query);

  const sugestii = useMemo(
    () => (q ? specialitati.filter((s) => norm(s).includes(q)) : []),
    [q, specialitati]
  );

  const mediciFiltrati = useMemo(
    () =>
      q
        ? medici.filter(
            (m) =>
              norm(m.specialitate).includes(q) ||
              norm(m.nume).includes(q) ||
              norm(m.locatie).includes(q)
          )
        : medici,
    [q, medici]
  );

  const arataSugestii = focused && sugestii.length > 0;

  const alegeSpecialitate = (s: string) => {
    setQuery(s);
    setFocused(false);
    Keyboard.dismiss();
  };

  const renderMedic = ({ item }: { item: Medic }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      {item.poza ? (
        <Image source={{ uri: item.poza }} style={styles.poza} />
      ) : (
        <View style={[styles.poza, styles.pozaGoala]}>
          <Text style={styles.initiale}>{initiale(item.nume) || '✚'}</Text>
        </View>
      )}

      <View style={styles.cardInfo}>
        <Text style={styles.medicNume} numberOfLines={1}>{item.nume}</Text>

        {!!item.specialitate && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{item.specialitate}</Text>
          </View>
        )}

        {!!item.locatie && <Text style={styles.detaliu}>📍 {item.locatie}</Text>}

        <View style={styles.randJos}>
          {item.rating !== undefined && (
            <Text style={styles.rating}>
              ⭐ {Number(item.rating).toFixed(1)}
              {item.reviewuri !== undefined && (
                <Text style={styles.reviewuri}>  ({item.reviewuri})</Text>
              )}
            </Text>
          )}
          {item.pret !== undefined && <Text style={styles.pret}>{item.pret} lei</Text>}
        </View>

        {!!item.program && (
          <Text style={styles.program}>
            🕒 {item.program}{item.zile ? `  •  ${item.zile}` : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.salut}>{nume ? `Bună, ${nume}` : 'Bine ai venit'}</Text>
      <Text style={styles.subtitlu}>Găsește medicul potrivit pentru tine</Text>

      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Caută specialitate, medic sau oraș..."
          placeholderTextColor={COLORS.muted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {arataSugestii && (
        <View style={styles.sugestii}>
          {sugestii.slice(0, 6).map((s) => (
            <TouchableOpacity key={s} style={styles.sugestie} onPress={() => alegeSpecialitate(s)}>
              <Text style={styles.sugestieText}>🩺  {s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.accent} size="large" />
      ) : (
        <FlatList
          data={mediciFiltrati}
          keyExtractor={(item) => item.id}
          renderItem={renderMedic}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                incarcaMedici();
              }}
              tintColor={COLORS.accent}
            />
          }
          ListHeaderComponent={
            <Text style={styles.numar}>
              {mediciFiltrati.length} {mediciFiltrati.length === 1 ? 'medic' : 'medici'}
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.gol}>{eroare || 'Niciun medic găsit pentru căutarea ta.'}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 16 },
  salut: { fontSize: 24, color: COLORS.text, fontWeight: '600' },
  subtitlu: { fontSize: 14, color: COLORS.muted, marginTop: 2, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', height: 52, backgroundColor: COLORS.input,
    borderRadius: 16, paddingHorizontal: 14, borderWidth: 1.5, borderColor: COLORS.inputBorder,
  },
  searchBarFocused: { borderColor: COLORS.accent, backgroundColor: '#FBEFE1' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  clear: { color: COLORS.accentDark, fontSize: 16, paddingLeft: 8 },
  sugestii: {
    backgroundColor: COLORS.card, borderRadius: 16, marginTop: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.inputBorder,
    shadowColor: '#8B6B4A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
  },
  sugestie: { paddingVertical: 12, paddingHorizontal: 16 },
  sugestieText: { color: COLORS.text, fontSize: 15 },
  numar: { fontSize: 13, color: COLORS.muted, marginTop: 18, marginBottom: 10, marginLeft: 4 },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 20,
    padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#F0E2D1',
    shadowColor: '#8B6B4A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2,
  },
  poza: { width: 92, height: 112, borderRadius: 16, marginRight: 14, backgroundColor: COLORS.input },
  pozaGoala: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.accent },
  initiale: { color: '#FFFDF9', fontSize: 24, fontWeight: '600' },
  cardInfo: { flex: 1, justifyContent: 'center' },
  medicNume: { fontSize: 17, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  chip: {
    alignSelf: 'flex-start', backgroundColor: COLORS.input, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.inputBorder, marginBottom: 6,
  },
  chipText: { fontSize: 12, color: COLORS.accentDark, fontWeight: '600' },
  detaliu: { fontSize: 13, color: COLORS.muted, marginBottom: 4 },
  randJos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  rating: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  reviewuri: { color: COLORS.muted, fontWeight: '400' },
  pret: { fontSize: 14, color: COLORS.accentDark, fontWeight: '700' },
  program: { fontSize: 12, color: COLORS.muted },
  gol: { textAlign: 'center', color: COLORS.muted, marginTop: 40, fontSize: 14 },
});