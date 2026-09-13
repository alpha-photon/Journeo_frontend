// All 28 states + 8 UTs of India with regions, capitals, and famous places checklist.

export const INDIA_STATES = [
  // ── North India ─────────────────────────────────────────────────────────────
  { code: 'DL',  name: 'Delhi',                 capital: 'New Delhi',    region: 'North',     icon: '🏛️', places: ['Red Fort', 'Qutub Minar', 'India Gate', "Humayun's Tomb", 'Lotus Temple', 'Chandni Chowk'] },
  { code: 'UP',  name: 'Uttar Pradesh',          capital: 'Lucknow',      region: 'North',     icon: '🕌', places: ['Taj Mahal', 'Agra Fort', 'Varanasi Ghats', 'Sarnath', 'Mathura', 'Vrindavan', 'Ayodhya'] },
  { code: 'RJ',  name: 'Rajasthan',              capital: 'Jaipur',       region: 'North',     icon: '🏰', places: ['Hawa Mahal', 'Amber Fort', 'Mehrangarh Fort', 'Jaisalmer Fort', 'Lake Pichola', 'Ranthambore'] },
  { code: 'HR',  name: 'Haryana',                capital: 'Chandigarh',   region: 'North',     icon: '🌾', places: ['Kurukshetra', 'Sultanpur Bird Sanctuary', 'Surajkund', 'Morni Hills'] },
  { code: 'PB',  name: 'Punjab',                 capital: 'Chandigarh',   region: 'North',     icon: '🌿', places: ['Golden Temple', 'Wagah Border', 'Jallianwala Bagh', 'Anandpur Sahib', 'Rock Garden'] },
  { code: 'HP',  name: 'Himachal Pradesh',       capital: 'Shimla',       region: 'North',     icon: '🏔️', places: ['Shimla Mall Road', 'Manali', 'Rohtang Pass', 'Dharamshala', 'Spiti Valley', 'Kasol'] },
  { code: 'UK',  name: 'Uttarakhand',            capital: 'Dehradun',     region: 'North',     icon: '🌄', places: ['Rishikesh', 'Haridwar', 'Kedarnath', 'Badrinath', 'Valley of Flowers', 'Auli', 'Jim Corbett'] },
  { code: 'JK',  name: 'Jammu & Kashmir',        capital: 'Srinagar',     region: 'North',     icon: '🏔️', places: ['Dal Lake', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Vaishno Devi', 'Patnitop'] },
  { code: 'LA',  name: 'Ladakh',                 capital: 'Leh',          region: 'North',     icon: '🏜️', places: ['Pangong Lake', 'Nubra Valley', 'Hemis Monastery', 'Magnetic Hill', 'Khardung La', 'Tso Moriri'] },

  // ── West India ──────────────────────────────────────────────────────────────
  { code: 'GJ',  name: 'Gujarat',                capital: 'Gandhinagar',  region: 'West',      icon: '🦁', places: ['Rann of Kutch', 'Gir Forest', 'Somnath Temple', 'Dwarka', 'Lothal', 'Ahmedabad Old City'] },
  { code: 'MH',  name: 'Maharashtra',            capital: 'Mumbai',       region: 'West',      icon: '🌊', places: ['Gateway of India', 'Ajanta Caves', 'Ellora Caves', 'Marine Drive', 'Shirdi', 'Lonavala'] },
  { code: 'GA',  name: 'Goa',                    capital: 'Panaji',       region: 'West',      icon: '🏖️', places: ['Baga Beach', 'Anjuna Beach', 'Basilica of Bom Jesus', 'Dudhsagar Falls', 'Old Goa', 'Calangute'] },
  { code: 'DD',  name: 'Dadra & Nagar Haveli',   capital: 'Silvassa',     region: 'West',      icon: '🌳', places: ['Satmaliya Deer Park', 'Vanganga Lake', 'Tribal Museum'] },
  { code: 'DN',  name: 'Daman & Diu',            capital: 'Daman',        region: 'West',      icon: '🏝️', places: ['Diu Fort', 'Nagoa Beach', 'St. Paul Church', 'Devka Beach'] },

  // ── South India ─────────────────────────────────────────────────────────────
  { code: 'KA',  name: 'Karnataka',              capital: 'Bengaluru',    region: 'South',     icon: '🌴', places: ['Hampi', 'Coorg', 'Mysore Palace', 'Chikmagalur', 'Gokarna', 'Jog Falls', 'Badami'] },
  { code: 'KL',  name: 'Kerala',                 capital: 'Thiruvananthapuram', region: 'South', icon: '🌿', places: ['Alleppey Backwaters', 'Munnar', 'Wayanad', 'Kovalam Beach', 'Thekkady', 'Varkala'] },
  { code: 'TN',  name: 'Tamil Nadu',             capital: 'Chennai',      region: 'South',     icon: '🛕', places: ['Meenakshi Temple', 'Ooty', 'Kodaikanal', 'Marina Beach', 'Mahabalipuram', 'Rameswaram'] },
  { code: 'AP',  name: 'Andhra Pradesh',         capital: 'Amaravati',    region: 'South',     icon: '⛪', places: ['Tirupati Balaji', 'Araku Valley', 'Gandikota', 'Horsley Hills', 'Vizag Beach'] },
  { code: 'TS',  name: 'Telangana',              capital: 'Hyderabad',    region: 'South',     icon: '🕌', places: ['Charminar', 'Golconda Fort', 'Ramoji Film City', 'Hussain Sagar', 'Warangal Fort'] },
  { code: 'PY',  name: 'Puducherry',             capital: 'Puducherry',   region: 'South',     icon: '🏘️', places: ['Promenade Beach', 'Auroville', 'French Quarter', 'Sri Aurobindo Ashram', 'Paradise Beach'] },
  { code: 'AN',  name: 'Andaman & Nicobar',      capital: 'Port Blair',   region: 'South',     icon: '🏝️', places: ['Radhanagar Beach', 'Cellular Jail', 'Havelock Island', 'Baratang', 'Neil Island'] },
  { code: 'LD',  name: 'Lakshadweep',            capital: 'Kavaratti',    region: 'South',     icon: '🐚', places: ['Agatti Island', 'Bangaram Atoll', 'Minicoy Island', 'Kalpeni Island'] },

  // ── East India ──────────────────────────────────────────────────────────────
  { code: 'WB',  name: 'West Bengal',            capital: 'Kolkata',      region: 'East',      icon: '🐯', places: ['Victoria Memorial', 'Howrah Bridge', 'Sundarbans', 'Darjeeling', 'Digha Beach', 'Kalighat'] },
  { code: 'OR',  name: 'Odisha',                 capital: 'Bhubaneswar',  region: 'East',      icon: '🛕', places: ['Puri Jagannath Temple', 'Konark Sun Temple', 'Chilika Lake', 'Rath Yatra', 'Bhitarkanika'] },
  { code: 'BR',  name: 'Bihar',                  capital: 'Patna',        region: 'East',      icon: '☸️', places: ['Bodh Gaya', 'Nalanda', 'Rajgir', 'Patna Sahib', 'Vaishali', 'Vikramshila'] },
  { code: 'JH',  name: 'Jharkhand',              capital: 'Ranchi',       region: 'East',      icon: '💎', places: ['Hundru Falls', 'Betla National Park', 'Jamshedpur', 'Deoghar', 'Netarhat'] },

  // ── Northeast India ─────────────────────────────────────────────────────────
  { code: 'AS',  name: 'Assam',                  capital: 'Dispur',       region: 'Northeast', icon: '🦏', places: ['Kaziranga NP', 'Majuli Island', 'Kamakhya Temple', 'Sivasagar', 'Manas NP', 'Haflong'] },
  { code: 'AR',  name: 'Arunachal Pradesh',      capital: 'Itanagar',     region: 'Northeast', icon: '🏔️', places: ['Tawang Monastery', 'Ziro Valley', 'Namdapha NP', 'Bomdila', 'Mechuka'] },
  { code: 'MN',  name: 'Manipur',                capital: 'Imphal',       region: 'Northeast', icon: '🌺', places: ['Loktak Lake', 'Kangla Fort', 'Keibul Lamjao NP', 'Dzükou Valley', 'Moreh'] },
  { code: 'MZ',  name: 'Mizoram',                capital: 'Aizawl',       region: 'Northeast', icon: '🌿', places: ['Vantawng Falls', 'Reiek', 'Phawngpui', 'Champhai', 'Lengteng Wildlife Sanctuary'] },
  { code: 'ML',  name: 'Meghalaya',              capital: 'Shillong',     region: 'Northeast', icon: '🌧️', places: ['Cherrapunji', 'Dawki River', 'Mawlynnong Village', 'Living Root Bridges', 'Shillong Peak'] },
  { code: 'NL',  name: 'Nagaland',               capital: 'Kohima',       region: 'Northeast', icon: '🎭', places: ['Hornbill Festival', 'Kohima War Cemetery', 'Dzükou Valley', 'Mon District', 'Japfu Peak'] },
  { code: 'TR',  name: 'Tripura',                capital: 'Agartala',     region: 'Northeast', icon: '🏯', places: ['Ujjayanta Palace', 'Neermahal', 'Unakoti', 'Sepahijala WS', 'Jampui Hills'] },
  { code: 'SK',  name: 'Sikkim',                 capital: 'Gangtok',      region: 'Northeast', icon: '🏔️', places: ['Gurudongmar Lake', 'Tsomgo Lake', 'Rumtek Monastery', 'Pelling', 'Yumthang Valley', 'Zero Point'] },

  // ── Central India ───────────────────────────────────────────────────────────
  { code: 'MP',  name: 'Madhya Pradesh',         capital: 'Bhopal',       region: 'Central',   icon: '🐆', places: ['Khajuraho', 'Kanha NP', 'Bandhavgarh', 'Pachmarhi', 'Sanchi Stupa', 'Orchha', 'Ujjain'] },
  { code: 'CG',  name: 'Chhattisgarh',           capital: 'Raipur',       region: 'Central',   icon: '🌊', places: ['Chitrakote Falls', 'Bastar', 'Tirathgarh Falls', 'Kanger Valley', 'Sirpur'] },
];

export const INDIA_REGIONS = ['North', 'West', 'South', 'East', 'Northeast', 'Central'];

export const REGION_COLORS = {
  North:     { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' },
  West:      { bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  text: 'text-amber-400',  dot: 'bg-amber-500'  },
  South:     { bg: 'bg-green-500/15',  border: 'border-green-500/30',  text: 'text-green-400',  dot: 'bg-green-500'  },
  East:      { bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400',   dot: 'bg-blue-500'   },
  Northeast: { bg: 'bg-teal-500/15',   border: 'border-teal-500/30',   text: 'text-teal-400',   dot: 'bg-teal-500'   },
  Central:   { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500' },
};

// India-specific badges
export const INDIA_BADGES = [
  { id: 'first_state',    name: 'Pehla Kadam',      icon: '👣', desc: 'Visited your first Indian state',           check: (d) => d.visitedCount >= 1 },
  { id: 'five_states',    name: 'Ghumakkad',         icon: '🎒', desc: 'Explored 5 states',                         check: (d) => d.visitedCount >= 5 },
  { id: 'fifteen_states', name: 'Incredible India',  icon: '🇮🇳', desc: 'Visited 15 states',                        check: (d) => d.visitedCount >= 15 },
  { id: 'twenty_five',    name: 'Desh Ghumakkad',    icon: '🌟', desc: 'Covered 25 states/UTs',                     check: (d) => d.visitedCount >= 25 },
  { id: 'all_states',     name: 'Bharat Explorer',   icon: '🏆', desc: 'Visited all 36 states & UTs',              check: (d) => d.visitedCount >= 36 },
  { id: 'golden_tri',     name: 'Golden Triangle',   icon: '🔺', desc: 'Delhi + Rajasthan + Uttar Pradesh',         check: (d) => d.visitedCodes.has('DL') && d.visitedCodes.has('RJ') && d.visitedCodes.has('UP') },
  { id: 'south_circuit',  name: 'South Circuit',     icon: '🌴', desc: 'Kerala + Tamil Nadu + Karnataka',           check: (d) => d.visitedCodes.has('KL') && d.visitedCodes.has('TN') && d.visitedCodes.has('KA') },
  { id: 'northeast',      name: 'Seven Sisters',     icon: '🌺', desc: 'Visited any Northeast state',               check: (d) => ['AS','AR','MN','MZ','ML','NL','TR'].some((c) => d.visitedCodes.has(c)) },
  { id: 'hills',          name: 'Hill Station Lover', icon: '🏔️', desc: 'HP + Uttarakhand + Sikkim',               check: (d) => d.visitedCodes.has('HP') && d.visitedCodes.has('UK') && d.visitedCodes.has('SK') },
  { id: 'beach_lover',    name: 'Beach Lover',        icon: '🏖️', desc: 'Goa + Kerala + Andaman',                  check: (d) => d.visitedCodes.has('GA') && d.visitedCodes.has('KL') && d.visitedCodes.has('AN') },
  { id: 'heritage',       name: 'Heritage Trail',     icon: '🏯', desc: 'Rajasthan + MP + UP',                      check: (d) => d.visitedCodes.has('RJ') && d.visitedCodes.has('MP') && d.visitedCodes.has('UP') },
  { id: 'spiritual',      name: 'Spiritual Seeker',   icon: '🕉️', desc: 'Varanasi (UP) + Tirupati (AP) + Puri (OR)', check: (d) => d.visitedCodes.has('UP') && d.visitedCodes.has('AP') && d.visitedCodes.has('OR') },
  { id: 'wildlife',       name: 'Wildlife Watcher',   icon: '🐯', desc: 'Visited 3 tiger reserves (MP/Rajasthan/Assam)', check: (d) => ['MP','RJ','AS','UK','WB'].filter((c) => d.visitedCodes.has(c)).length >= 3 },
  { id: 'all_regions',    name: 'Har Kona India',     icon: '🗺️', desc: 'Visited all 6 regions of India',           check: (d) => d.regionsVisited >= 6 },
  { id: 'leh_lover',      name: 'Leh Lover',          icon: '🏜️', desc: 'Conquered Ladakh',                         check: (d) => d.visitedCodes.has('LA') },
  { id: 'gods_country',   name: "God's Own Country",  icon: '🌿', desc: 'Visited Kerala',                            check: (d) => d.visitedCodes.has('KL') },
  { id: 'places_10',      name: 'Place Collector',    icon: '📍', desc: 'Checked off 10 famous places',              check: (d) => d.visitedPlacesCount >= 10 },
  { id: 'places_25',      name: 'Avid Explorer',      icon: '🗺️', desc: 'Checked off 25 famous places',             check: (d) => d.visitedPlacesCount >= 25 },
];

export const STATE_BY_CODE = Object.fromEntries(INDIA_STATES.map((s) => [s.code, s]));
