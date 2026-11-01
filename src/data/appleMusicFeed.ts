import { Track, Playlist } from '../types';

export interface FeedBanner {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  caption: string;
  coverUrl: string;
  track: Track;
}

export interface FeedAlbum {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  badge?: string;
  explicit?: boolean;
}

export interface FeedPlaylist extends Playlist {
  title: string;
  curator: string;
  badge?: string;
}

// ══════════════════════════════════════════════════════════════
// 1. TOP HERO CAROUSEL BANNERS (Empty as requested by user)
// ══════════════════════════════════════════════════════════════
export const FEED_BANNERS: FeedBanner[] = [];

// ══════════════════════════════════════════════════════════════
// 2. LAS MEJORES CANCIONES NUEVAS (Real Official Apple Music Covers & Tracks)
// ══════════════════════════════════════════════════════════════
export const MEJORES_CANCIONES_NUEVAS: Track[] = [
  {
    id: '1538809230',
    title: 'Hawái (Remix)',
    artist: 'Maluma & The Weeknd',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9c/3c/e1/9c3ce198-2af9-fb1c-3968-905decc0a8d2/886448874324.jpg/1000x1000bb.jpg',
    audioUrl: '/api/yt-audio?title=Hawai+Remix&artist=Maluma+The+Weeknd',
    duration: 200,
    durationFormatted: '03:20',
    isVerified: true,
  },
  {
    id: '1800579241',
    title: 'intro (end of the world) [extended]',
    artist: 'Ariana Grande',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/f0/dc/98f0dcff-559c-2910-c0b1-5ba6b66748d4/25UMGIM42096.rgb.jpg/1000x1000bb.jpg',
    audioUrl: '/api/stream?id=3294514241',
    duration: 161,
    durationFormatted: '02:41',
    isVerified: true,
  },
  {
    id: '1522667852',
    title: 'Tacones Rojos',
    artist: 'Sebastián Yatra',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/00c297f61a9a7af15833daf8ec87cc8c/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=1522667852',
    duration: 188,
    durationFormatted: '03:08',
  },
  {
    id: '2840602132',
    title: 'miau',
    artist: 'Young Cister',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/09cb83b3d7399d95bdead57c4b7a82b5/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=2840602132',
    duration: 183,
    durationFormatted: '03:03',
  },
  {
    id: '572115812',
    title: 'Arms Around You (feat. Maluma & Swae Lee)',
    artist: 'XXXTENTACION & Lil Pump',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/234871dc6c2f30bfc5255c6ead8c93e4/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=572115812',
    duration: 198,
    durationFormatted: '03:18',
  },
  {
    id: '12702141',
    title: 'Caricias Prohibidas',
    artist: 'Viti Ruiz',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/534ce175d0d8fd2031cfa47adff515ab/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=12702141',
    duration: 321,
    durationFormatted: '05:21',
  },
  {
    id: '4278534982',
    title: 'como olvidar?',
    artist: 'Rels B',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/5f8baa0930670acc9193c61032ccf1d3/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=4278534982',
    duration: 108,
    durationFormatted: '01:48',
    isVerified: true,
  },
  {
    id: 'new-2',
    title: 'chicle mal enganchado',
    artist: 'Rigoberta Bandini',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/22/44/da/2244da06-1829-dd53-f231-cd7026c2c8ce/885288457063.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bc/f4/bf/bcf4bf89-53e7-e6f5-8fe0-c9a9d700346a/mzaf_4727192666750014210.plus.aac.p.m4a',
    duration: 198,
    durationFormatted: '03:18',
  },
  {
    id: 'new-3',
    title: 'lucero',
    artist: 'Belén Aguilera',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2b/8f/3f/2b8f3fd0-064b-0d98-faf6-c0454f25eb76/196874728277.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f5/ba/47/f5ba47e1-ae76-6548-bbff-4b361dfa9ba2/mzaf_6288600004975765518.plus.aac.p.m4a',
    duration: 215,
    durationFormatted: '03:35',
  },
  {
    id: 'new-4',
    title: 'Amiga Date Cuenta',
    artist: 'MARLENA',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/37/88/74/3788746e-c36b-8e15-1463-f674ddd48142/26UM1IM07897.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/31/32/79/31327914-7221-a3f1-f2fe-d840919aa786/mzaf_10540455437877239308.plus.aac.p.m4a',
    duration: 176,
    durationFormatted: '02:56',
  },
  {
    id: 'new-5',
    title: 'Daylight',
    artist: 'John Legend',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/df/1b/c6/df1bc6c4-c2a7-66e9-afc0-46c9ae49516a/26UM1IM12676.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c4/86/e1/c486e114-16a7-0f66-81cf-1fbf62a59e37/mzaf_8141443653139369974.plus.aac.p.m4a',
    duration: 228,
    durationFormatted: '03:48',
  },
  {
    id: 'new-6',
    title: 'Norte',
    artist: 'Inazio',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/02/41/81/02418142-8152-473b-b6af-403937b34661/196871357456.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/77/5a/b3/775ab36e-04bd-d1b1-3226-453bb5a0a9af/mzaf_6862000878534198798.plus.aac.p.m4a',
    duration: 192,
    durationFormatted: '03:12',
  },
  {
    id: 'new-7',
    title: 'Contigo',
    artist: 'Marta Santos',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f8/bd/95/f8bd957c-57ea-3d08-7092-037142d2feae/5021732534026.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b9/78/33/b978330e-54ea-7901-4be5-a45b63aa6824/mzaf_5319803131754868212.plus.aac.p.m4a',
    duration: 204,
    durationFormatted: '03:24',
  },
  {
    id: 'new-8',
    title: 'Si Tú Te Vas',
    artist: 'Luis Cortés',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ef/43/2d/ef432dc3-ac31-5042-66bc-6824b77b91ad/823375404385_Cover.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f7/a9/14/f7a9144d-15ec-a801-4475-654cb6c5e7b2/mzaf_10793617300346376510.plus.aac.p.m4a',
    duration: 220,
    durationFormatted: '03:40',
  },
  {
    id: 'new-9',
    title: 'BbY WOW',
    artist: 'KAROL G, Judeline & rusowsky',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2b/66/b2/2b66b26c-ab23-faa1-c4ee-06fa2cce8f76/26UM1IM00558.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f3/08/da/f308da3d-00cc-7682-7be9-87cb882f4ea5/mzaf_129115212197250565.plus.aac.p.m4a',
    duration: 226,
    durationFormatted: '03:45',
  },
];

// ══════════════════════════════════════════════════════════════
// 3. NUEVO ESTA SEMANA (Real Album Artworks - Removed Camilo & Bonobo)
// ══════════════════════════════════════════════════════════════
export const NUEVO_ESTA_SEMANA: FeedAlbum[] = [
  {
    id: 'sem-1',
    title: 'Éxitos 2026 (Deluxe)',
    artist: 'Bizarrap & Young Miko',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/14/54/f1/1454f160-c956-7727-46dc-5101bb109494/197187714988.jpg/600x600bb.jpg',
  },
  {
    id: 'sem-2',
    title: 'Noches de Verano 2026',
    artist: 'Quevedo & Saiko',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8a/d9/3e/8ad93ec4-5d61-9759-c92d-d9571b86224c/197338610251.jpg/600x600bb.jpg',
  },
  {
    id: 'sem-3',
    title: 'ReVivo - EP',
    artist: 'Ricky Martin',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ee/f0/ef/eef0ef74-83c1-2c39-7c2a-c9d20f621f88/196874160213.jpg/600x600bb.jpg',
  },
  {
    id: 'sem-4',
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
  },
  {
    id: 'sem-5',
    title: 'After Hours',
    artist: 'The Weeknd',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/b9/fe/2bb9fef5-d7f3-8345-25a9-db0e79fde4e4/20UMGIM11048.rgb.jpg/600x600bb.jpg',
  },
];

// ══════════════════════════════════════════════════════════════
// 4. LANZAMIENTOS RECIENTES (Real Album Artworks)
// ══════════════════════════════════════════════════════════════
export const LANZAMIENTOS_RECIENTES: FeedAlbum[] = [
  {
    id: 'lanz-1',
    title: "B'DAY (20th ANNIVERSARY)",
    artist: 'Beyoncé',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/83/b2/be/83b2be70-affe-43f8-00f5-8c9dd5d4f1a3/196874746608.jpg/600x600bb.jpg',
  },
  {
    id: 'lanz-2',
    title: 'El arte de perder',
    artist: 'Veintiuno',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/6f/a5/f2/6fa5f237-5c27-740b-5b59-1531e63e582c/5054197679605.jpg/600x600bb.jpg',
  },
  {
    id: 'lanz-3',
    title: 'Submarine',
    artist: 'The Marías',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/0b/4d/b6/0b4db6bd-2d40-55a5-1714-67f5c816294d/075679659644.jpg/600x600bb.jpg',
  },
  {
    id: 'lanz-4',
    title: 'EL MAL QUERER',
    artist: 'ROSALÍA',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/2c/55/e1/2c55e13f-15d8-1c7c-1826-c5fa55deaa8f/886447217139.jpg/600x600bb.jpg',
  },
  {
    id: 'lanz-5',
    title: 'El Madrileño',
    artist: 'C. Tangana',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/53/f3/fc/53f3fccd-2024-789e-8858-c9562cc1edfa/886449216321.jpg/600x600bb.jpg',
  },
];

// ══════════════════════════════════════════════════════════════
// 5. PLAYLISTS ACTUALIZADAS (Real Apple Music Editorial Playlists with Full Tracklists)
// ══════════════════════════════════════════════════════════════
export const PLAYLISTS_ACTUALIZADAS: FeedPlaylist[] = [
  {
    id: 'pl-curated-exitos-espana',
    name: 'Éxitos España',
    title: 'Éxitos España',
    curator: 'Pop latino',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9e/fa/6f/9efa6fe0-5ce8-3f55-7ed6-24cda7d77505/196874447369.jpg/600x600bb.jpg',
    createdAt: Date.now() - 86400000 * 2,
    tracks: [
      {
        id: '2471587001',
        title: 'Corazón Frío',
        artist: 'Jasiel Nuñez & DannyLux',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/47d63c60149eef016d3d4411edd62c28/1000x1000-000000-80-0-0.jpg',
        audioUrl: '/api/stream?id=2471587001',
        duration: 263,
        durationFormatted: '04:24',
      },
      {
        id: '2343546465',
        title: 'LAGUNAS',
        artist: 'Peso Pluma & Jasiel Nuñez',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/dcf1796783e798bb34462017156d57c3/1000x1000-000000-80-0-0.jpg',
        audioUrl: '/api/stream?id=2343546465',
        duration: 231,
        durationFormatted: '03:51',
      },
      {
        id: '1563415172',
        title: 'Aquel Nap ZzZz',
        artist: 'Rauw Alejandro',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/a37d5de6838312531d93af97e3e31463/1000x1000-000000-80-0-0.jpg',
        audioUrl: '/api/stream?id=1563415172',
        duration: 295,
        durationFormatted: '04:55',
      },
      {
        id: 'hit-1',
        title: 'BbY WOW',
        artist: 'KAROL G, Judeline & rusowsky',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2b/66/b2/2b66b26c-ab23-faa1-c4ee-06fa2cce8f76/26UM1IM00558.rgb.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f3/08/da/f308da3d-00cc-7682-7be9-87cb882f4ea5/mzaf_129115212197250565.plus.aac.p.m4a',
        duration: 226,
        durationFormatted: '03:45',
      },
      {
        id: 'hit-2',
        title: 'LA GRACIOSA',
        artist: 'Quevedo & Elvis Crespo',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/56/e5/bf/56e5bfea-2071-1224-1c62-f6119195a949/8718521173821.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/39/aa/44/39aa4460-bd57-f070-c044-705bd22425d6/mzaf_10319592044362853670.plus.aac.p.m4a',
        duration: 258,
        durationFormatted: '04:17',
      },
      {
        id: 'hit-3',
        title: 'DUELE UN MONTÓN DESPEDIRME DE TI',
        artist: 'Aitana & Jay Wheeler',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/43/08/06/430806b8-3b40-649f-37e9-37ff2ab702df/25UMGIM52016.rgb.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/84/d3/ce/84d3ce12-bc48-395b-dbe8-1ba9408c5614/mzaf_13441060487867663107.plus.aac.p.m4a',
        duration: 180,
        durationFormatted: '03:00',
      },
      {
        id: 'hit-7',
        title: 'pa ti toa <3',
        artist: 'Ana Mena & Lola Indigo',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9e/fa/6f/9efa6fe0-5ce8-3f55-7ed6-24cda7d77505/196874447369.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e3/b4/62/e3b462fe-5ec8-7c8d-4511-0826324cd5d0/mzaf_5896432236588976474.plus.aac.p.m4a',
        duration: 213,
        durationFormatted: '03:33',
      },
      {
        id: 'hit-8',
        title: 'Columbia',
        artist: 'Quevedo',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8a/d9/3e/8ad93ec4-5d61-9759-c92d-d9571b86224c/197338610251.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0a/9b/c2/0a9bc24e-9231-26d0-e492-cc4a098607d6/mzaf_18022283109657019339.plus.aac.p.m4a',
        duration: 186,
        durationFormatted: '03:06',
      },
      {
        id: 'hit-5',
        title: 'Solo',
        artist: 'Omar Montes, Ana Mena & Maffio',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d7/5d/5c/d75d5c9c-e90b-cb82-4645-489cd82e3bd2/886449001026.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e8/e4/c4/e8e4c460-426e-301f-c055-908ed92dddb8/mzaf_561151079849231114.plus.aac.p.m4a',
        duration: 204,
        durationFormatted: '03:24',
      },
    ],
  },
  {
    id: 'pl-curated-dale-reggaeton',
    name: 'Dale Reggaetón',
    title: 'Dale Reggaetón',
    curator: 'Urbano latino',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/56/e5/bf/56e5bfea-2071-1224-1c62-f6119195a949/8718521173821.jpg/600x600bb.jpg',
    createdAt: Date.now() - 86400000 * 3,
    tracks: [
      {
        id: 'hit-2',
        title: 'LA GRACIOSA',
        artist: 'Quevedo & Elvis Crespo',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/56/e5/bf/56e5bfea-2071-1224-1c62-f6119195a949/8718521173821.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/39/aa/44/39aa4460-bd57-f070-c044-705bd22425d6/mzaf_10319592044362853670.plus.aac.p.m4a',
        duration: 258,
        durationFormatted: '04:17',
      },
      {
        id: 'regg-feid-1',
        title: 'Feliz Cumpleaños Ferxxo',
        artist: 'Feid',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/49/8d/b0/498db03e-5a0f-04fb-91c2-cd33d425f44b/22UMGIM88226.rgb.jpg/600x600bb.jpg',
        duration: 156,
        durationFormatted: '02:36',
      },
      {
        id: 'hit-8',
        title: 'Columbia',
        artist: 'Quevedo',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8a/d9/3e/8ad93ec4-5d61-9759-c92d-d9571b86224c/197338610251.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0a/9b/c2/0a9bc24e-9231-26d0-e492-cc4a098607d6/mzaf_18022283109657019339.plus.aac.p.m4a',
        duration: 186,
        durationFormatted: '03:06',
      },
      {
        id: 'hit-6',
        title: 'Dardos',
        artist: 'Romeo Santos & Prince Royce',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/60/66/a9/6066a9a2-b1e8-d171-d8b3-7d044c040b94/196873751887.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/dd/72/96/dd72963a-c515-a551-b47e-583c99c6bfd0/mzaf_10273637570356807203.plus.aac.p.m4a',
        duration: 243,
        durationFormatted: '04:03',
      },
      {
        id: 'top-badbunny-2',
        title: 'Tití Me Preguntó',
        artist: 'Bad Bunny',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
        duration: 243,
        durationFormatted: '04:03',
      },
    ],
  },
  {
    id: 'pl-curated-novedades-viernes',
    name: 'Novedades diarias',
    title: 'Novedades diarias',
    curator: 'Novedades',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2b/66/b2/2b66b26c-ab23-faa1-c4ee-06fa2cce8f76/26UM1IM00558.rgb.jpg/600x600bb.jpg',
    createdAt: Date.now() - 86400000 * 1,
    tracks: [
      {
        id: 'new-2',
        title: 'chicle mal enganchado',
        artist: 'Rigoberta Bandini',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/22/44/da/2244da06-1829-dd53-f231-cd7026c2c8ce/885288457063.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bc/f4/bf/bcf4bf89-53e7-e6f5-8fe0-c9a9d700346a/mzaf_4727192666750014210.plus.aac.p.m4a',
        duration: 198,
        durationFormatted: '03:18',
      },
      {
        id: 'new-3',
        title: 'lucero',
        artist: 'Belén Aguilera',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2b/8f/3f/2b8f3fd0-064b-0d98-faf6-c0454f25eb76/196874728277.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f5/ba/47/f5ba47e1-ae76-6548-bbff-4b361dfa9ba2/mzaf_6288600004975765518.plus.aac.p.m4a',
        duration: 215,
        durationFormatted: '03:35',
      },
      {
        id: 'new-4',
        title: 'Amiga Date Cuenta',
        artist: 'MARLENA',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/37/88/74/3788746e-c36b-8e15-1463-f674ddd48142/26UM1IM07897.rgb.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/31/32/79/31327914-7221-a3f1-f2fe-d840919aa786/mzaf_10540455437877239308.plus.aac.p.m4a',
        duration: 176,
        durationFormatted: '02:56',
      },
      {
        id: 'new-5',
        title: 'Daylight',
        artist: 'John Legend',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/df/1b/c6/df1bc6c4-c2a7-66e9-afc0-46c9ae49516a/26UM1IM12676.rgb.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c4/86/e1/c486e114-16a7-0f66-81cf-1fbf62a59e37/mzaf_8141443653139369974.plus.aac.p.m4a',
        duration: 228,
        durationFormatted: '03:48',
      },
      {
        id: 'new-8',
        title: 'Si Tú Te Vas',
        artist: 'Luis Cortés',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ef/43/2d/ef432dc3-ac31-5042-66bc-6824b77b91ad/823375404385_Cover.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f7/a9/14/f7a9144d-15ec-a801-4475-654cb6c5e7b2/mzaf_10793617300346376510.plus.aac.p.m4a',
        duration: 220,
        durationFormatted: '03:40',
      },
    ],
  },
  {
    id: 'pl-curated-mujeres-alfa',
    name: 'Mujeres alfa',
    title: 'Mujeres alfa',
    curator: 'Pop femenino',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/22/44/da/2244da06-1829-dd53-f231-cd7026c2c8ce/885288457063.jpg/600x600bb.jpg',
    createdAt: Date.now() - 86400000 * 4,
    tracks: [
      {
        id: 'hit-1',
        title: 'BbY WOW',
        artist: 'KAROL G, Judeline & rusowsky',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2b/66/b2/2b66b26c-ab23-faa1-c4ee-06fa2cce8f76/26UM1IM00558.rgb.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f3/08/da/f308da3d-00cc-7682-7be9-87cb882f4ea5/mzaf_129115212197250565.plus.aac.p.m4a',
        duration: 226,
        durationFormatted: '03:45',
      },
      {
        id: 'hit-3',
        title: 'DUELE UN MONTÓN DESPEDIRME DE TI',
        artist: 'Aitana & Jay Wheeler',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/43/08/06/430806b8-3b40-649f-37e9-37ff2ab702df/25UMGIM52016.rgb.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/84/d3/ce/84d3ce12-bc48-395b-dbe8-1ba9408c5614/mzaf_13441060487867663107.plus.aac.p.m4a',
        duration: 180,
        durationFormatted: '03:00',
      },
      {
        id: 'hit-4',
        title: 'Shakira: Bzrp Music Sessions, Vol. 53',
        artist: 'Bizarrap & Shakira',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/14/54/f1/1454f160-c956-7727-46dc-5101bb109494/197187714988.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/01/0a/ad/010aad31-e4e8-0e0b-ff0c-a60fb1e88a2e/mzaf_7160223173554222430.plus.aac.p.m4a',
        duration: 215,
        durationFormatted: '03:34',
      },
      {
        id: 'hit-7',
        title: 'pa ti toa <3',
        artist: 'Ana Mena & Lola Indigo',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9e/fa/6f/9efa6fe0-5ce8-3f55-7ed6-24cda7d77505/196874447369.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e3/b4/62/e3b462fe-5ec8-7c8d-4511-0826324cd5d0/mzaf_5896432236588976474.plus.aac.p.m4a',
        duration: 213,
        durationFormatted: '03:33',
      },
      {
        id: 'new-3',
        title: 'lucero',
        artist: 'Belén Aguilera',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2b/8f/3f/2b8f3fd0-064b-0d98-faf6-c0454f25eb76/196874728277.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f5/ba/47/f5ba47e1-ae76-6548-bbff-4b361dfa9ba2/mzaf_6288600004975765518.plus.aac.p.m4a',
        duration: 215,
        durationFormatted: '03:35',
      },
    ],
  },
  {
    id: 'pl-curated-conexion-afrolatina',
    name: 'Conexión afrolatina',
    title: 'Conexión afrolatina',
    curator: 'Afro & Tropical',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/60/66/a9/6066a9a2-b1e8-d171-d8b3-7d044c040b94/196873751887.jpg/600x600bb.jpg',
    createdAt: Date.now() - 86400000 * 5,
    tracks: [
      {
        id: 'hit-6',
        title: 'Dardos',
        artist: 'Romeo Santos & Prince Royce',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/60/66/a9/6066a9a2-b1e8-d171-d8b3-7d044c040b94/196873751887.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/dd/72/96/dd72963a-c515-a551-b47e-583c99c6bfd0/mzaf_10273637570356807203.plus.aac.p.m4a',
        duration: 243,
        durationFormatted: '04:03',
      },
      {
        id: 'hit-2',
        title: 'LA GRACIOSA',
        artist: 'Quevedo & Elvis Crespo',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/56/e5/bf/56e5bfea-2071-1224-1c62-f6119195a949/8718521173821.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/39/aa/44/39aa4460-bd57-f070-c044-705bd22425d6/mzaf_10319592044362853670.plus.aac.p.m4a',
        duration: 258,
        durationFormatted: '04:17',
      },
      {
        id: 'hit-5',
        title: 'Solo',
        artist: 'Omar Montes, Ana Mena & Maffio',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d7/5d/5c/d75d5c9c-e90b-cb82-4645-489cd82e3bd2/886449001026.jpg/600x600bb.jpg',
        audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e8/e4/c4/e8e4c460-426e-301f-c055-908ed92dddb8/mzaf_561151079849231114.plus.aac.p.m4a',
        duration: 204,
        durationFormatted: '03:24',
      },
      {
        id: 'top-badbunny-1',
        title: 'Me Porto Bonito',
        artist: 'Bad Bunny & Chencho Corleone',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
        duration: 178,
        durationFormatted: '02:58',
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// 6. ÁLBUMES DESTACADOS (Real Albums)
// ══════════════════════════════════════════════════════════════
export const ALBUMES_DESTACADOS: FeedAlbum[] = [
  {
    id: 'dest-1',
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
  },
  {
    id: 'dest-2',
    title: 'EL MAL QUERER',
    artist: 'ROSALÍA',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/2c/55/e1/2c55e13f-15d8-1c7c-1826-c5fa55deaa8f/886447217139.jpg/600x600bb.jpg',
  },
  {
    id: 'dest-3',
    title: 'Feliz Cumpleaños Ferxxo',
    artist: 'Feid',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/49/8d/b0/498db03e-5a0f-04fb-91c2-cd33d425f44b/22UMGIM88226.rgb.jpg/600x600bb.jpg',
  },
  {
    id: 'dest-4',
    title: 'El Madrileño',
    artist: 'C. Tangana',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/53/f3/fc/53f3fccd-2024-789e-8858-c9562cc1edfa/886449216321.jpg/600x600bb.jpg',
  },
  {
    id: 'dest-5',
    title: 'After Hours',
    artist: 'The Weeknd',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/b9/fe/2bb9fef5-d7f3-8345-25a9-db0e79fde4e4/20UMGIM11048.rgb.jpg/600x600bb.jpg',
  },
];

// ══════════════════════════════════════════════════════════════
// 7. ÉXITOS DEL MOMENTO (Real Tracks, Authentic Covers & Playable Apple Previews)
// ══════════════════════════════════════════════════════════════
export const EXITOS_DEL_MOMENTO: Track[] = [
  {
    id: '563029042',
    title: 'Desconocidos',
    artist: 'Mau y Ricky, Manuel Turizo & Camilo',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/f239717aa92df0d33ee285e5a73944a8/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=563029042',
    duration: 204,
    durationFormatted: '03:24',
  },
  {
    id: '348386281',
    title: 'Una Lady Como Tú',
    artist: 'Manuel Turizo',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/6171ad87d4a9f96760a90b77d615d283/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=348386281',
    duration: 213,
    durationFormatted: '03:33',
  },
  {
    id: '493108512',
    title: 'Corazón (feat. Nego do Borel)',
    artist: 'Maluma',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/8f7f531b2bcebeffef064d973dedb24a/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=493108512',
    duration: 184,
    durationFormatted: '03:04',
  },
  {
    id: '1522667852',
    title: 'Tacones Rojos',
    artist: 'Sebastián Yatra',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/00c297f61a9a7af15833daf8ec87cc8c/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=1522667852',
    duration: 188,
    durationFormatted: '03:08',
  },
  {
    id: '2840602132',
    title: 'miau',
    artist: 'Young Cister',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/09cb83b3d7399d95bdead57c4b7a82b5/1000x1000-000000-80-0-0.jpg',
    audioUrl: '/api/stream?id=2840602132',
    duration: 183,
    durationFormatted: '03:03',
  },
  {
    id: 'hit-1',
    title: 'BbY WOW',
    artist: 'KAROL G, Judeline & rusowsky',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2b/66/b2/2b66b26c-ab23-faa1-c4ee-06fa2cce8f76/26UM1IM00558.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f3/08/da/f308da3d-00cc-7682-7be9-87cb882f4ea5/mzaf_129115212197250565.plus.aac.p.m4a',
    duration: 226,
    durationFormatted: '03:45',
  },
  {
    id: 'hit-2',
    title: 'LA GRACIOSA',
    artist: 'Quevedo & Elvis Crespo',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/56/e5/bf/56e5bfea-2071-1224-1c62-f6119195a949/8718521173821.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/39/aa/44/39aa4460-bd57-f070-c044-705bd22425d6/mzaf_10319592044362853670.plus.aac.p.m4a',
    duration: 258,
    durationFormatted: '04:17',
  },
  {
    id: 'hit-3',
    title: 'DUELE UN MONTÓN DESPEDIRME DE TI',
    artist: 'Aitana & Jay Wheeler',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/43/08/06/430806b8-3b40-649f-37e9-37ff2ab702df/25UMGIM52016.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/84/d3/ce/84d3ce12-bc48-395b-dbe8-1ba9408c5614/mzaf_13441060487867663107.plus.aac.p.m4a',
    duration: 180,
    durationFormatted: '03:00',
  },
  {
    id: 'hit-4',
    title: 'Shakira: Bzrp Music Sessions, Vol. 53',
    artist: 'Bizarrap & Shakira',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/14/54/f1/1454f160-c956-7727-46dc-5101bb109494/197187714988.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/01/0a/ad/010aad31-e4e8-0e0b-ff0c-a60fb1e88a2e/mzaf_7160223173554222430.plus.aac.p.m4a',
    duration: 215,
    durationFormatted: '03:34',
  },
  {
    id: 'hit-5',
    title: 'Solo',
    artist: 'Omar Montes, Ana Mena & Maffio',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d7/5d/5c/d75d5c9c-e90b-cb82-4645-489cd82e3bd2/886449001026.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e8/e4/c4/e8e4c460-426e-301f-c055-908ed92dddb8/mzaf_561151079849231114.plus.aac.p.m4a',
    duration: 204,
    durationFormatted: '03:24',
  },
  {
    id: 'hit-6',
    title: 'Dardos',
    artist: 'Romeo Santos & Prince Royce',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/60/66/a9/6066a9a2-b1e8-d171-d8b3-7d044c040b94/196873751887.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/dd/72/96/dd72963a-c515-a551-b47e-583c99c6bfd0/mzaf_10273637570356807203.plus.aac.p.m4a',
    duration: 243,
    durationFormatted: '04:03',
  },
  {
    id: 'hit-7',
    title: 'pa ti toa <3',
    artist: 'Ana Mena & Lola Indigo',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9e/fa/6f/9efa6fe0-5ce8-3f55-7ed6-24cda7d77505/196874447369.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e3/b4/62/e3b462fe-5ec8-7c8d-4511-0826324cd5d0/mzaf_5896432236588976474.plus.aac.p.m4a',
    duration: 213,
    durationFormatted: '03:33',
  },
  {
    id: 'hit-8',
    title: 'Columbia',
    artist: 'Quevedo',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8a/d9/3e/8ad93ec4-5d61-9759-c92d-d9571b86224c/197338610251.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0a/9b/c2/0a9bc24e-9231-26d0-e492-cc4a098607d6/mzaf_18022283109657019339.plus.aac.p.m4a',
    duration: 186,
    durationFormatted: '03:06',
  },
];

// ══════════════════════════════════════════════════════════════
// 8. TODO EL MUNDO ESTÁ ESCUCHANDO... (Real Legendary Albums)
// ══════════════════════════════════════════════════════════════
export const TODO_EL_MUNDO: FeedAlbum[] = [
  {
    id: 'world-1',
    title: 'The Blueprint',
    artist: 'JAY-Z',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/19/c0/e3/19c0e3b6-4c2f-17ee-2a4a-6e2208de8aa6/00857366006951.rgb.jpg/600x600bb.jpg',
    explicit: true,
  },
  {
    id: 'world-2',
    title: "B'DAY (20th ANNIVERSARY)",
    artist: 'Beyoncé',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/83/b2/be/83b2be70-affe-43f8-00f5-8c9dd5d4f1a3/196874746608.jpg/600x600bb.jpg',
  },
  {
    id: 'world-3',
    title: 'El Madrileño',
    artist: 'C. Tangana',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/53/f3/fc/53f3fccd-2024-789e-8858-c9562cc1edfa/886449216321.jpg/600x600bb.jpg',
  },
  {
    id: 'world-4',
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
  },
];
