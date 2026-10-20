/* =====================================================================
   Tour de Israel – נתוני הדגמה
   ---------------------------------------------------------------------
   כל הנתונים בקובץ הזה בדויים ומיועדים להדגמה בלבד.
   שמות מורי הדרך, מספרי הרישיון, חוות הדעת והמחירים – לדוגמה.

   איך עורכים:
   • תאריכים נכתבים כ-day(N): מספר הימים מהיום (שלילי = בעבר).
     כך הדמו נשאר עדכני בכל יום שבו מציגים אותו.
     אפשר גם לכתוב תאריך קבוע כמחרוזת: '2026-11-12'.
   • טקסט דו-לשוני נכתב כ-{ he: '...', en: '...' }.
   • תמונות: מזהה תמונה מ-Unsplash (החלק שאחרי photo- בכתובת).
   ===================================================================== */

(function () {
  'use strict';

  /** תאריך בפורמט YYYY-MM-DD, N ימים מהיום (לפי שעון המכשיר) */
  function day(n) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + n);
    const pad = (x) => String(x).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /* ---------------- פרטי האתר ---------------- */
  const SITE = {
    name: 'Tour de Israel',
    phone: '03-555-0123',            // לדוגמה
    phoneIntl: '+97235550123',
    whatsapp: '972500000000',        // לדוגמה – מספר וואטסאפ בפורמט בינלאומי, בלי +
    email: 'info@tourdeisrael.example',
    hours: {
      he: [
        ['א׳–ה׳', '08:00–20:00'],
        ['ו׳ וערבי חג', '08:00–13:00'],
        ['שבת וחג', 'סגור (הודעות וואטסאפ ייענו במוצ״ש)']
      ],
      en: [
        ['Sun–Thu', '08:00–20:00'],
        ['Fri & holiday eves', '08:00–13:00'],
        ['Sat & holidays', 'Closed (WhatsApp messages answered Saturday night)']
      ]
    },
    // כתובות לדוגמה – להחליף בכתובות האמיתיות
    social: {
      facebook: 'https://www.facebook.com/tourdeisrael',
      instagram: 'https://www.instagram.com/tourdeisrael',
      youtube: 'https://www.youtube.com/@tourdeisrael',
      tiktok: 'https://www.tiktok.com/@tourdeisrael'
    }
  };

  /* ---------------- מורי דרך (בדויים) ---------------- */
  const GUIDES = [
    {
      id: 'uri',
      name: { he: 'אורי בן-דוד', en: 'Uri Ben-David' },
      color: '#0f5c63',
      license: '10-4821 (לדוגמה)',
      years: 14,
      responseMins: 40,
      langs: ['he', 'en'],
      specialties: ['geopolitics', 'security', 'history'],
      bio: {
        he: 'אורי שירת כקצין בפיקוד הדרום ומדריך כבר 14 שנה סיורים בנושאי ביטחון, גבולות וגיאופוליטיקה. אחרי 7 באוקטובר הוא מוביל סיורי זיכרון ועדות בעוטף עזה, בשיתוף התושבים. הוא מאמין שהדרך הטובה ביותר להבין את ישראל היא לעמוד בשטח, להקשיב לאנשים ולשאול את השאלות הקשות.',
        en: 'Uri served as an officer in the Southern Command and has been guiding tours on security, borders and geopolitics for 14 years. Since October 7th he leads remembrance and testimony tours in the Gaza envelope, together with local residents. He believes the best way to understand Israel is to stand on the ground, listen to people and ask the hard questions.'
      }
    },
    {
      id: 'noa',
      name: { he: 'נועה לוי-שגיא', en: 'Noa Levi-Sagi' },
      color: '#7a3e9d',
      license: '10-5307 (לדוגמה)',
      years: 9,
      responseMins: 90,
      langs: ['he', 'en', 'es'],
      specialties: ['archaeology', 'history', 'tradition'],
      bio: {
        he: 'ארכיאולוגית בהכשרתה, שהשתתפה בחפירות במגידו ובעיר דוד. נועה הופכת תלי עפר לסיפורים חיים על מלכים, נביאים וקרבות, ומדריכה בעברית, באנגלית ובספרדית.',
        en: 'An archaeologist by training who took part in excavations at Megiddo and the City of David. Noa turns dusty tells into living stories of kings, prophets and battles, and guides in Hebrew, English and Spanish.'
      }
    },
    {
      id: 'yael',
      name: { he: 'יעל כרמי', en: 'Yael Carmi' },
      color: '#c2571a',
      license: '10-6110 (לדוגמה)',
      years: 7,
      responseMins: 25,
      langs: ['he', 'en'],
      specialties: ['families', 'food', 'wine'],
      bio: {
        he: 'אמא לשלושה, שפית לשעבר ומדריכה שיודעת להחזיק קשב של ילדים בני 6 וגם של סבתא בת 80. יעל מתמחה בסיורי משפחות ובסיורים קולינריים בשווקים ובמושבות הוותיקות.',
        en: 'A mother of three, former chef and a guide who can hold the attention of a 6-year-old and an 80-year-old grandmother alike. Yael specialises in family tours and culinary tours of markets and historic villages.'
      }
    },
    {
      id: 'david',
      name: { he: 'דוד אזולאי', en: 'David Azoulay' },
      color: '#1d5fa8',
      license: '10-3954 (לדוגמה)',
      years: 21,
      responseMins: 120,
      langs: ['he', 'fr'],
      specialties: ['tradition', 'history'],
      bio: {
        he: 'דוד עלה מצרפת לפני 25 שנה ומדריך בעברית ובצרפתית. הוא מתמחה במסורת יהודית, קברי צדיקים ומסלולי סליחות, ומשלב בסיורים סיפורי חסידים, פיוטים ומנהגים מכל העדות.',
        en: 'David immigrated from France 25 years ago and guides in Hebrew and French. He specialises in Jewish tradition, tombs of the righteous and Selichot routes, weaving Hasidic tales, liturgical poems and customs from all communities into his tours.'
      }
    },
    {
      id: 'ron',
      name: { he: 'רון אלמוג', en: 'Ron Almog' },
      color: '#8a6a12',
      license: '10-7742 (לדוגמה)',
      years: 11,
      responseMins: 60,
      langs: ['he', 'en', 'ar'],
      specialties: ['desert', 'adventure', 'abroad', 'security'],
      bio: {
        he: 'איש מדבר ושטח, מדריך ג׳יפים ומוביל קבוצות לפטרה ולסיני כבר יותר מעשור. רון דובר ערבית, מכיר כל ואדי בנגב, ודואג שכל משתתף יחזור הביתה עם אבק על הנעליים וחיוך על הפנים.',
        en: 'A desert and off-road man, jeep guide and group leader to Petra and Sinai for more than a decade. Ron speaks Arabic, knows every wadi in the Negev and makes sure everyone goes home with dust on their shoes and a smile on their face.'
      }
    }
  ];

  /* ---------------- טיולים ----------------
     type:       סוג הטיול (מילון קבוע ב-i18n.js → types)
     region:     north | center | jerusalem | south | jordan | sinai
     langs:      שפות ההדרכה
     interests:  תחומי עניין (מילון קבוע ב-i18n.js → interests)
     duration:   half (עד 5 שעות) | day (יום מלא) | multi (יותר מיום)
     difficulty: easy | moderate | hard
     price:      מחיר למבוגר בש״ח. ילדים (6–12): 20% הנחה
     dates:      מועדים. טיול שכל מועדיו עברו – לא יוצג באתר.
  ------------------------------------------ */
  const TRIPS = [
    {
      id: 'oct7-he',
      type: 'heritage', region: 'south', langs: ['he'],
      interests: ['history', 'security', 'community'],
      duration: 'day', hours: 9, difficulty: 'easy', price: 240, maxGroup: 40,
      guide: 'uri',
      title: { he: 'עוטף עזה בעקבות 7 באוקטובר', en: 'The Gaza Envelope: Following October 7th' },
      short: {
        he: 'יום של זיכרון, עדות ותקומה: בארי, נחל עוז, שדרות ואתר הנובה, עם מפגש תושבים.',
        en: 'A day of remembrance, testimony and renewal: Be’eri, Nahal Oz, Sderot and the Nova site, meeting local residents.'
      },
      desc: {
        he: [
          'סיור רגיש ומעמיק באזור שבו התחולל אחד הימים הקשים בתולדות המדינה. נעמוד במקומות עצמם, נשמע את סיפורי הגבורה והאובדן, ונבין את המציאות הביטחונית לאורך הגבול.',
          'הסיור מתקיים בתיאום עם הקהילות המקומיות. חלק מההכנסות מועבר לעסקים מקומיים בעוטף, וארוחת הצהריים נערכת אצל משפחה מקומית.'
        ],
        en: [
          'A sensitive, in-depth tour of the area where one of the darkest days in Israel’s history took place. We will stand at the sites themselves, hear stories of heroism and loss, and understand the security reality along the border.',
          'The tour is coordinated with the local communities. Part of the proceeds goes to local businesses in the envelope, and lunch is hosted by a local family.'
        ]
      },
      highlights: {
        he: ['אתר ההנצחה של פסטיבל נובה ברעים', 'תצפית על הגבול מגבעת חץ', 'שדרות – תחנת המשטרה ומרכז החוסן', 'מפגש עם תושב/ת קיבוץ בעוטף'],
        en: ['The Nova festival memorial site at Re’im', 'Border lookout from Hetz Hill', 'Sderot – the police station and the resilience centre', 'Meeting a kibbutz resident']
      },
      meeting: { place: { he: 'תחנת רכבת תל אביב – סבידור מרכז', en: 'Tel Aviv Savidor Central train station' }, time: '07:30', lat: 32.0838, lng: 34.7983 },
      included: { he: ['אוטובוס ממוזג', 'הדרכה מלאה', 'ארוחת צהריים', 'ביטוח'], en: ['Air-conditioned bus', 'Full guiding', 'Lunch', 'Insurance'] },
      notIncluded: { he: ['תרומה אישית לקהילה (לא חובה)'], en: ['Personal donation to the community (optional)'] },
      images: ['1509316785289-025f5b846b35', '1500382017468-9049fed747ef', '1470509037663-253afd7f0f51'],
      theme: 'south',
      dates: [day(4), day(18), day(32), day(46)]
    },
    {
      id: 'oct7-en',
      type: 'heritage', region: 'south', langs: ['en'],
      interests: ['history', 'security', 'community'],
      duration: 'day', hours: 9, difficulty: 'easy', price: 290, maxGroup: 30,
      guide: 'uri',
      title: { he: 'עוטף עזה בעקבות 7 באוקטובר (באנגלית)', en: 'October 7th: Gaza Envelope Tour in English' },
      short: {
        he: 'הסיור המבוקש בגרסה באנגלית, למבקרים מחו״ל, לקהילות ולמשלחות.',
        en: 'Our most requested tour, in English, for visitors from abroad, communities and delegations.'
      },
      desc: {
        he: [
          'גרסה באנגלית של סיור הזיכרון והעדות בעוטף עזה, עם הסבר רקע מורחב על ההיסטוריה של האזור ועל המצב הגיאופוליטי, למי שמגיע מחו״ל.',
          'יציאה מתל אביב, ואפשר לתאם איסוף מירושלים לקבוצות.'
        ],
        en: [
          'The English edition of our remembrance and testimony tour of the Gaza envelope, with extended background on the history of the region and its geopolitics for visitors from abroad.',
          'Departs from Tel Aviv; pickup from Jerusalem can be arranged for groups.'
        ]
      },
      highlights: {
        he: ['אתר ההנצחה של פסטיבל נובה', 'קיבוץ כפר עזה – סיור מודרך עם תושב', 'תצפית על הגבול', 'שדרות'],
        en: ['The Nova festival memorial', 'Kibbutz Kfar Aza – guided by a resident', 'Border lookout', 'Sderot']
      },
      meeting: { place: { he: 'מלון דן, רחוב הירקון 99, תל אביב', en: 'Dan Hotel, 99 HaYarkon St., Tel Aviv' }, time: '07:45', lat: 32.0835, lng: 34.7676 },
      included: { he: ['הסעה ממוזגת', 'הדרכה באנגלית', 'ארוחת צהריים', 'מים'], en: ['Air-conditioned transport', 'English guiding', 'Lunch', 'Water'] },
      notIncluded: { he: ['טיפ למדריך ולנהג'], en: ['Tips for guide and driver'] },
      images: ['1500382017468-9049fed747ef', '1509316785289-025f5b846b35', '1470509037663-253afd7f0f51'],
      theme: 'south',
      dates: [day(7), day(21), day(49)]
    },
    {
      id: 'jerusalem-conflict',
      type: 'geopolitics', region: 'jerusalem', langs: ['he', 'en'],
      interests: ['geopolitics', 'history', 'religion'],
      duration: 'day', hours: 6, difficulty: 'moderate', price: 260, maxGroup: 25,
      guide: 'uri',
      title: { he: 'ירושלים – הבנת הסכסוך', en: 'Jerusalem: Understanding the Conflict' },
      short: {
        he: 'קווי התפר, הגדר, השכונות והקדושה: סיור שמסביר את ירושלים בלי סיסמאות.',
        en: 'Seam lines, the barrier, neighbourhoods and holiness: Jerusalem explained without slogans.'
      },
      desc: {
        he: [
          'ירושלים היא לב הסכסוך, ובסיור הזה ננסה להבין אותה מכל הכיוונים: היסטוריה, דת, דמוגרפיה, תשתיות וביטחון. נבקר בתצפיות מרכזיות ובשכונות על קו התפר.',
          'זה סיור שמעודד שאלות. המדריך מציג נרטיבים שונים ונותן לכם לגבש עמדה בעצמכם.'
        ],
        en: [
          'Jerusalem is the heart of the conflict, and on this tour we try to understand it from every angle: history, religion, demography, infrastructure and security. We visit key lookouts and seam-line neighbourhoods.',
          'This tour encourages questions. The guide presents different narratives and lets you form your own view.'
        ]
      },
      highlights: {
        he: ['תצפית מהטיילת בארמון הנציב', 'קו התפר ושער שכם', 'גדר הביטחון והמעברים', 'הר הצופים – מבט על המדבר'],
        en: ['Lookout from the Armon HaNatziv promenade', 'The seam line and Damascus Gate', 'The security barrier and crossings', 'Mount Scopus – view over the desert']
      },
      meeting: { place: { he: 'שער יפו, ירושלים', en: 'Jaffa Gate, Jerusalem' }, time: '09:00', lat: 31.7767, lng: 35.2276 },
      included: { he: ['הדרכה', 'נסיעות בין האתרים', 'מים'], en: ['Guiding', 'Transport between sites', 'Water'] },
      notIncluded: { he: ['ארוחת צהריים', 'הגעה לנקודת המפגש'], en: ['Lunch', 'Getting to the meeting point'] },
      images: ['1552423314-cf29ab68ad73', '1544967082-d9d25d867d66', '1547483238-2cbf881a559f'],
      theme: 'jerusalem',
      dates: [day(3), day(10), day(24), day(38), day(52)]
    },
    {
      id: 'jerusalem-family',
      type: 'family', region: 'jerusalem', langs: ['he', 'en'],
      interests: ['kids', 'history'],
      duration: 'half', hours: 4.5, difficulty: 'easy', price: 150, maxGroup: 30,
      guide: 'yael',
      title: { he: 'ירושלים לכל המשפחה', en: 'Jerusalem for the Whole Family' },
      short: {
        he: 'חידות, משחק תפקידים וסמטאות סודיות בעיר העתיקה, לילדים מגיל 6 ומעלה.',
        en: 'Riddles, role play and secret alleys in the Old City, for kids aged 6 and up.'
      },
      desc: {
        he: [
          'הילדים מקבלים "מפת חוקרים" ויוצאים למשימה בעיר העתיקה: לפענח רמזים, לטפס על החומות ולגלות איך חיו כאן ילדים לפני אלפי שנים.',
          'הקצב מותאם למשפחות, יש הפסקות, והמסלול נגיש לעגלות ברובו.'
        ],
        en: [
          'Kids get an “explorer’s map” and set out on a mission in the Old City: decode clues, walk on the ramparts and discover how children lived here thousands of years ago.',
          'The pace suits families, with breaks, and most of the route is stroller-friendly.'
        ]
      },
      highlights: {
        he: ['טיילת החומות', 'הקארדו הרומי', 'הכותל המערבי', 'משימת חוקרים עם פרס בסוף'],
        en: ['The Ramparts Walk', 'The Roman Cardo', 'The Western Wall', 'Explorer mission with a prize at the end']
      },
      meeting: { place: { he: 'מגדל דוד, ירושלים', en: 'Tower of David, Jerusalem' }, time: '10:00', lat: 31.7762, lng: 35.2283 },
      included: { he: ['הדרכה', 'ערכת חוקרים לכל ילד', 'כניסה לטיילת החומות'], en: ['Guiding', 'Explorer kit for each child', 'Ramparts Walk entry'] },
      notIncluded: { he: ['ארוחות', 'חניה'], en: ['Meals', 'Parking'] },
      images: ['1547483238-2cbf881a559f', '1552423314-cf29ab68ad73', '1544967082-d9d25d867d66'],
      theme: 'jerusalem',
      dates: [day(6), day(13), day(27), day(41)]
    },
    {
      id: 'carmel-market',
      type: 'culinary', region: 'center', langs: ['he', 'en'],
      interests: ['food', 'culture'],
      duration: 'half', hours: 3.5, difficulty: 'easy', price: 190, maxGroup: 16,
      guide: 'yael',
      title: { he: 'סיור קולינרי: שוק הכרמל וכרם התימנים', en: 'Culinary Tour: Carmel Market & the Yemenite Quarter' },
      short: {
        he: '10 תחנות טעימה, סיפורי עלייה ותבלינים, וקבוצות קטנות של עד 16 משתתפים.',
        en: '10 tasting stops, immigration stories and spices, in small groups of up to 16.'
      },
      desc: {
        he: [
          'השוק הוא הדרך הטעימה ביותר להכיר את ישראל: מלאוח תימני וסביח עיראקי ועד בורקס טורקי וקפה עם הל. בכל תחנה מחכה טעימה וגם סיפור על העדה שהביאה אותה.',
          'כדאי להגיע רעבים. יש התאמה לצמחונים, ולטבעונים בתיאום מראש.'
        ],
        en: [
          'The market is the tastiest way to get to know Israel: from Yemenite malawach and Iraqi sabich to Turkish bourekas and cardamom coffee. Every stop comes with a bite and a story about the community that brought it.',
          'Come hungry. Vegetarian options are available, and vegan options with advance notice.'
        ]
      },
      highlights: {
        he: ['10 תחנות טעימה', 'סמטאות כרם התימנים', 'דוכני התבלינים', 'קינוח מפתיע בסוף'],
        en: ['10 tasting stops', 'The alleys of the Yemenite Quarter', 'Spice stalls', 'A surprise dessert at the end']
      },
      meeting: { place: { he: 'כיכר מגן דוד, תל אביב', en: 'Magen David Square, Tel Aviv' }, time: '10:30', lat: 32.0688, lng: 34.7690 },
      included: { he: ['כל הטעימות', 'שתייה קלה', 'הדרכה'], en: ['All tastings', 'Soft drinks', 'Guiding'] },
      notIncluded: { he: ['אלכוהול', 'קניות אישיות בשוק'], en: ['Alcohol', 'Personal market shopping'] },
      images: ['1488459716781-31db52582fe9', '1555939594-58d7cb561ad1', '1504674900247-0877df9cc836'],
      theme: 'food',
      dates: [day(2), day(9), day(16), day(30), day(44)]
    },
    {
      id: 'tzadikim',
      type: 'tradition', region: 'north', langs: ['he', 'fr'],
      interests: ['religion', 'history'],
      duration: 'day', hours: 10, difficulty: 'moderate', price: 210, maxGroup: 45,
      guide: 'david',
      title: { he: 'קברי צדיקים בגליל', en: 'Tombs of the Righteous in the Galilee' },
      short: {
        he: 'מירון, צפת ועמוקה: יום של תפילה, סיפורים ופיוטים. ההדרכה בעברית ובצרפתית.',
        en: 'Meron, Safed and Amuka: a day of prayer, stories and song. Guided in Hebrew and French.'
      },
      desc: {
        he: [
          'מסע בעקבות גדולי ישראל בגליל: רבי שמעון בר יוחאי במירון, האר״י הקדוש בצפת ורבי יונתן בן עוזיאל בעמוקה. בין הקברים נשמע סיפורי מקובלים ונבקר בבתי הכנסת העתיקים של צפת.',
          'הסיור מתאים לכל רמות שמירת המסורת. יש זמן לתפילה אישית בכל אתר.'
        ],
        en: [
          'A journey in the footsteps of great Jewish sages in the Galilee: Rabbi Shimon bar Yochai at Meron, the Holy Ari in Safed and Rabbi Yonatan ben Uziel at Amuka. Between the tombs we hear Kabbalists’ tales and visit Safed’s ancient synagogues.',
          'The tour suits every level of observance, with time for personal prayer at each site.'
        ]
      },
      highlights: {
        he: ['ציון רשב״י במירון', 'בתי הכנסת העתיקים בצפת', 'עמוקה', 'סעודת הודיה בצפת'],
        en: ['Rabbi Shimon bar Yochai’s tomb at Meron', 'Safed’s ancient synagogues', 'Amuka', 'Thanksgiving meal in Safed']
      },
      meeting: { place: { he: 'חניון רכבת גלילות', en: 'Glilot train station parking' }, time: '06:30', lat: 32.1450, lng: 34.8040 },
      included: { he: ['אוטובוס', 'הדרכה', 'ארוחת צהריים כשרה למהדרין'], en: ['Bus', 'Guiding', 'Strictly kosher lunch'] },
      notIncluded: { he: ['תרומות לאתרים'], en: ['Donations at the sites'] },
      images: ['1441974231531-c6227db76b6e', '1464822759023-fed622ff2c3b', '1426604966848-d7adac402bff'],
      theme: 'north',
      dates: [day(8), day(22), day(36), day(50)]
    },
    {
      id: 'northern-border',
      type: 'geopolitics', region: 'north', langs: ['he', 'en'],
      interests: ['security', 'geopolitics', 'nature'],
      duration: 'day', hours: 10, difficulty: 'moderate', price: 250, maxGroup: 40,
      guide: 'ron',
      title: { he: 'גבול הצפון: מראש הנקרה ועד מטולה', en: 'The Northern Border: Rosh HaNikra to Metula' },
      short: {
        he: 'תצפיות על לבנון ועל רמת הגולן, יישובי קו העימות והמציאות הביטחונית בצפון.',
        en: 'Lookouts over Lebanon and the Golan, frontline communities and the security reality in the north.'
      },
      desc: {
        he: [
          'לאורך קו הגבול עם לבנון נעצור בתצפיות שמספרות את סיפור הצפון: מלחמות, נסיגות, מנהרות וחזרה הביתה. נפגוש את תושבי קו העימות ונשמע איך נראים החיים כאן היום.',
          'הסיור מתעדכן לפי המצב הביטחוני ומתקיים רק באישור הגורמים המוסמכים.'
        ],
        en: [
          'Along the Lebanese border we stop at lookouts that tell the story of the north: wars, withdrawals, tunnels and coming home. We meet frontline residents and hear what life is like here today.',
          'The route is updated according to the security situation and runs only with official approval.'
        ]
      },
      highlights: {
        he: ['תצפית ראש הנקרה', 'הר אדיר', 'גדר המערכת במטולה', 'מפגש עם תושבי קו העימות'],
        en: ['Rosh HaNikra lookout', 'Mount Adir', 'The border fence at Metula', 'Meeting frontline residents']
      },
      meeting: { place: { he: 'תחנת רכבת חוף הכרמל, חיפה', en: 'Haifa Hof HaCarmel train station' }, time: '08:00', lat: 32.7935, lng: 34.9575 },
      included: { he: ['אוטובוס', 'הדרכה', 'ארוחת צהריים'], en: ['Bus', 'Guiding', 'Lunch'] },
      notIncluded: { he: ['רכבל ראש הנקרה'], en: ['Rosh HaNikra cable car'] },
      images: ['1464822759023-fed622ff2c3b', '1426604966848-d7adac402bff', '1441974231531-c6227db76b6e'],
      theme: 'north',
      dates: [day(11), day(25), day(39), day(53)]
    },
    {
      id: 'jezreel-kings',
      type: 'history', region: 'north', langs: ['he'],
      interests: ['archaeology', 'history', 'nature'],
      duration: 'day', hours: 8, difficulty: 'moderate', price: 200, maxGroup: 40,
      guide: 'noa',
      title: { he: 'עמק יזרעאל בעקבות מלכי ישראל', en: 'Jezreel Valley: In the Footsteps of the Kings of Israel' },
      short: {
        he: 'מגידו, תל יזרעאל והר הגלבוע: שאול, אחאב ואיזבל, בדרך של ארכיאולוגית.',
        en: 'Megiddo, Tel Jezreel and Mount Gilboa: Saul, Ahab and Jezebel, through an archaeologist’s eyes.'
      },
      desc: {
        he: [
          'עמק יזרעאל היה צומת הדרכים של העולם העתיק. נעלה לתל מגידו, אתר מורשת עולמית של אונסק״ו, נרד למפעל המים הקדום ונעמוד במקום שבו נפל שאול המלך על הגלבוע.',
          'נועה, ארכיאולוגית שחפרה במגידו, תביא לסיור ממצאים וסיפורים מהשטח.'
        ],
        en: [
          'The Jezreel Valley was the crossroads of the ancient world. We climb Tel Megiddo, a UNESCO World Heritage site, descend into its ancient water system and stand where King Saul fell on Mount Gilboa.',
          'Noa, an archaeologist who excavated at Megiddo, brings finds and stories straight from the dig.'
        ]
      },
      highlights: {
        he: ['תל מגידו ומפעל המים', 'תל יזרעאל – ארמון אחאב', 'תצפית הגלבוע', 'מעיין חרוד'],
        en: ['Tel Megiddo and its water system', 'Tel Jezreel – Ahab’s palace', 'Gilboa lookout', 'Harod Spring']
      },
      meeting: { place: { he: 'הכניסה לגן הלאומי תל מגידו', en: 'Tel Megiddo National Park entrance' }, time: '08:30', lat: 32.5853, lng: 35.1840 },
      included: { he: ['הדרכה', 'כניסה לגנים הלאומיים'], en: ['Guiding', 'National park entry'] },
      notIncluded: { he: ['הסעה', 'ארוחות'], en: ['Transport', 'Meals'] },
      images: ['1500382017468-9049fed747ef', '1470509037663-253afd7f0f51', '1426604966848-d7adac402bff'],
      theme: 'north',
      dates: [day(5), day(19), day(33), day(47)]
    },
    {
      id: 'zichron',
      type: 'culinary', region: 'center', langs: ['he'],
      interests: ['wine', 'history', 'culture'],
      duration: 'day', hours: 7, difficulty: 'easy', price: 230, maxGroup: 25,
      guide: 'yael',
      title: { he: 'זיכרון יעקב ובנימינה: יין, ברון ומושבה', en: 'Zichron Ya’akov & Binyamina: Wine, the Baron and the Colony' },
      short: {
        he: 'המושבות של הברון רוטשילד, מחתרת ניל״י, ושתי טעימות ביקב בוטיק.',
        en: 'Baron Rothschild’s colonies, the NILI underground and two boutique-winery tastings.'
      },
      desc: {
        he: [
          'נטייל ברחוב המייסדים, נשמע את סיפורה של שרה אהרנסון ומחתרת ניל״י, ונבין איך הפכו המושבות האלה לבירת היין של ישראל.',
          'בהמשך נרד לבנימינה, לטעימות בשני יקבי בוטיק ולארוחה קלה בין הכרמים.'
        ],
        en: [
          'We stroll down Founders Street, hear the story of Sarah Aaronsohn and the NILI underground, and see how these colonies became Israel’s wine capital.',
          'Then we head down to Binyamina for tastings at two boutique wineries and a light meal among the vines.'
        ]
      },
      highlights: {
        he: ['רחוב המייסדים', 'בית אהרנסון', 'שתי טעימות יין', 'ארוחה בכרם'],
        en: ['Founders Street', 'Aaronsohn House', 'Two wine tastings', 'Lunch in the vineyard']
      },
      meeting: { place: { he: 'רחוב המייסדים, זיכרון יעקב', en: 'HaMeyasdim St., Zichron Ya’akov' }, time: '09:30', lat: 32.5715, lng: 34.9530 },
      included: { he: ['הדרכה', 'שתי טעימות יין', 'ארוחה קלה', 'כניסה לבית אהרנסון'], en: ['Guiding', 'Two wine tastings', 'Light meal', 'Aaronsohn House entry'] },
      notIncluded: { he: ['הסעה'], en: ['Transport'] },
      images: ['1506377247377-2a5b3b417ebb', '1510812431401-41d2bd2722f3', '1500382017468-9049fed747ef'],
      theme: 'wine',
      dates: [day(12), day(26), day(40), day(54)]
    },
    {
      id: 'selichot',
      type: 'tradition', region: 'jerusalem', langs: ['he'],
      interests: ['religion', 'culture'],
      duration: 'half', hours: 4, difficulty: 'easy', price: 120, maxGroup: 50,
      guide: 'david',
      title: { he: 'סיור סליחות בירושלים', en: 'Selichot Night Tour in Jerusalem' },
      short: {
        he: 'לילה של פיוטים ותקיעות שופר בבתי הכנסת של נחלאות ובעיר העתיקה.',
        en: 'A night of liturgical poems and shofar blasts in the synagogues of Nachlaot and the Old City.'
      },
      desc: {
        he: [
          'בחודש אלול מתמלאת ירושלים בלילות של סליחות. נעבור בין בתי כנסת ספרדיים, תימניים ואשכנזיים בנחלאות ונסיים ברחבת הכותל.',
          'הסיור מתחיל בשעת לילה מאוחרת. כדאי להצטייד בבגדים חמים.'
        ],
        en: [
          'In the month of Elul, Jerusalem fills with nights of Selichot. We move between Sephardi, Yemenite and Ashkenazi synagogues in Nachlaot and end at the Western Wall plaza.',
          'The tour starts late at night, so bring warm clothes.'
        ]
      },
      highlights: { he: ['בתי הכנסת של נחלאות', 'פיוטים בכתב יד', 'סליחות ברחבת הכותל'], en: ['Nachlaot synagogues', 'Handwritten liturgical poems', 'Selichot at the Western Wall'] },
      meeting: { place: { he: 'כיכר ספרא, ירושלים', en: 'Safra Square, Jerusalem' }, time: '22:00', lat: 31.7785, lng: 35.2250 },
      included: { he: ['הדרכה', 'שתייה חמה'], en: ['Guiding', 'Hot drinks'] },
      notIncluded: { he: ['הסעה'], en: ['Transport'] },
      images: ['1544967082-d9d25d867d66', '1552423314-cf29ab68ad73'],
      theme: 'jerusalem',
      // ⚠ דוגמה לטיול שעבר – לא יוצג ברשימות
      dates: [day(-38), day(-31)]
    },
    {
      id: 'ramon-jeeps',
      type: 'adventure', region: 'south', langs: ['he', 'en'],
      interests: ['nature', 'photography'],
      duration: 'day', hours: 9, difficulty: 'moderate', price: 330, maxGroup: 24,
      guide: 'ron',
      title: { he: 'טיול ג׳יפים במכתש רמון', en: 'Jeep Tour of the Ramon Crater' },
      short: {
        he: 'ג׳יפים פתוחים, דרכי עפר, המנסרה והר ארדון, וקפה שחור על גחלים בשקיעה.',
        en: 'Open jeeps, dirt tracks, the Carpentry and Mount Ardon, and coffee on embers at sunset.'
      },
      desc: {
        he: [
          'מכתש רמון הוא אחד הנופים המרשימים בעולם. נרד אליו בג׳יפים, נטפס לתצפיות ונעצור ליד תופעות גיאולוגיות נדירות כמו המנסרה וגבעת האמוניטים.',
          'ננהג בעצמנו בליווי המדריך (נדרש רישיון נהיגה בתוקף) או נשב כנוסעים.'
        ],
        en: [
          'The Ramon Crater is one of the most striking landscapes on earth. We drive down in jeeps, climb to lookouts and stop at rare geological features such as the Carpentry and the Ammonite Wall.',
          'Drive yourself with the guide leading (valid licence required) or ride as a passenger.'
        ]
      },
      highlights: { he: ['המנסרה', 'הר ארדון', 'קיר האמוניטים', 'קפה על גחלים בשקיעה'], en: ['The Carpentry', 'Mount Ardon', 'Ammonite Wall', 'Coffee on embers at sunset'] },
      meeting: { place: { he: 'מרכז המבקרים, מצפה רמון', en: 'Mitzpe Ramon Visitor Center' }, time: '08:00', lat: 30.6101, lng: 34.8011 },
      included: { he: ['ג׳יפ ודלק', 'הדרכה', 'ארוחת שטח', 'ביטוח'], en: ['Jeep and fuel', 'Guiding', 'Field meal', 'Insurance'] },
      notIncluded: { he: ['הגעה למצפה רמון', 'לינה'], en: ['Getting to Mitzpe Ramon', 'Accommodation'] },
      images: ['1473580044384-7ba9967e16a0', '1509316785289-025f5b846b35', '1533473359331-0135ef1b58bf'],
      theme: 'south',
      dates: [day(9), day(23), day(37), day(51)]
    },
    {
      id: 'petra',
      type: 'abroad', region: 'jordan', langs: ['he', 'en'],
      interests: ['archaeology', 'history'],
      duration: 'day', hours: 14, difficulty: 'hard', price: 350, maxGroup: 30,
      guide: 'ron',
      title: { he: 'פטרה בירדן – יום מלא', en: 'Petra, Jordan – Full Day' },
      short: {
        he: 'העיר הוורודה של הנבטים: הסיק, החזנה והמנזר, ביום אחד מאילת.',
        en: 'The Nabataeans’ rose-red city: the Siq, the Treasury and the Monastery, in one day from Eilat.'
      },
      desc: {
        he: [
          'חוצים את הגבול באילת ונוסעים לפטרה, אחד משבעת פלאי העולם החדשים. נצעד דרך הסיק אל החזנה, נטייל ברחוב הקולונדות ונטפס (למי שרוצה) למנזר.',
          'הליכה של כ-12 ק״מ. נדרשים דרכון בתוקף לחצי שנה לפחות ונעלי הליכה נוחות.'
        ],
        en: [
          'We cross the border at Eilat and drive to Petra, one of the New Seven Wonders of the World. We walk through the Siq to the Treasury, along the Colonnaded Street and, for those who wish, up to the Monastery.',
          'About 12 km of walking. A passport valid for at least six months and comfortable walking shoes are required.'
        ]
      },
      highlights: { he: ['הסיק', 'החזנה', 'רחוב הקולונדות', 'המנזר (אופציונלי)'], en: ['The Siq', 'The Treasury', 'The Colonnaded Street', 'The Monastery (optional)'] },
      meeting: { place: { he: 'מעבר הגבול יצחק רבין, אילת', en: 'Yitzhak Rabin border crossing, Eilat' }, time: '06:00', lat: 29.5733, lng: 34.9762 },
      included: { he: ['הסעה ממוזגת בירדן', 'מדריך ישראלי ומדריך מקומי', 'ארוחת צהריים'], en: ['Air-conditioned transport in Jordan', 'Israeli and local guide', 'Lunch'] },
      notIncluded: { he: ['אשרה ודמי כניסה לפטרה', 'מסי גבול'], en: ['Visa and Petra entry fee', 'Border taxes'] },
      images: ['1579606032821-4e6161c81bd3', '1473580044384-7ba9967e16a0', '1509316785289-025f5b846b35'],
      theme: 'jordan',
      dates: [day(14), day(28), day(42), day(56)]
    },
    {
      id: 'sinai',
      type: 'abroad', region: 'sinai', langs: ['he'],
      interests: ['nature', 'religion', 'history'],
      duration: 'multi', hours: 36, difficulty: 'hard', price: 350, maxGroup: 20,
      guide: 'ron',
      title: { he: 'סיני: סנטה קתרינה וזריחה בהר משה', en: 'Sinai: St. Catherine & Sunrise on Mount Sinai' },
      short: {
        he: 'יומיים בהרי סיני: לינה בכפר בדואי, טיפוס לילי ומנזר בן 1,500 שנה.',
        en: 'Two days in the Sinai mountains: a Bedouin village stay, a night climb and a 1,500-year-old monastery.'
      },
      desc: {
        he: [
          'יוצאים מטאבה לעומק הרי סיני. בלילה מטפסים לפסגת ג׳בל מוסא כדי לראות משם את הזריחה, ובבוקר מבקרים במנזר סנטה קתרינה העתיק.',
          'יש לבדוק את הנחיות המטה לביטחון לאומי לפני ההרשמה. הטיול יתקיים רק אם אין אזהרת מסע.'
        ],
        en: [
          'From Taba we head deep into the Sinai mountains. At night we climb Jebel Musa to watch the sunrise from its summit, and in the morning we visit the ancient St. Catherine’s Monastery.',
          'Check the National Security Council travel advisories before booking. The trip runs only if no travel warning is in effect.'
        ]
      },
      highlights: { he: ['זריחה בפסגת הר משה', 'מנזר סנטה קתרינה', 'לינה בכפר בדואי', 'ארוחה בדואית'], en: ['Sunrise atop Mount Sinai', 'St. Catherine’s Monastery', 'Bedouin village stay', 'Bedouin dinner'] },
      meeting: { place: { he: 'מעבר הגבול טאבה', en: 'Taba border crossing' }, time: '07:00', lat: 29.4910, lng: 34.9050 },
      included: { he: ['הסעות', 'לינה בסיסית', 'ארוחות', 'מדריך בדואי'], en: ['Transport', 'Basic lodging', 'Meals', 'Bedouin guide'] },
      notIncluded: { he: ['אשרת סיני', 'ביטוח נסיעות'], en: ['Sinai visa', 'Travel insurance'] },
      images: ['1464822759023-fed622ff2c3b', '1473580044384-7ba9967e16a0'],
      theme: 'sinai',
      dates: [day(17), day(45)]
    },
    {
      id: 'sukkot-jerusalem',
      type: 'family', region: 'jerusalem', langs: ['he'],
      interests: ['kids', 'religion'],
      duration: 'half', hours: 4, difficulty: 'easy', price: 140, maxGroup: 40,
      guide: 'noa',
      title: { he: 'חול המועד סוכות: עולים לירושלים', en: 'Sukkot: Going Up to Jerusalem' },
      short: {
        he: 'בעקבות עולי הרגל: ארבעת המינים, סוכות מיוחדות וברכת כוהנים.',
        en: 'In the pilgrims’ footsteps: the Four Species, special sukkot and the Priestly Blessing.'
      },
      desc: {
        he: ['סיור משפחתי בחול המועד בעקבות עולי הרגל בימי בית המקדש.', 'מתאים לילדים מגיל 5.'],
        en: ['A family tour during Sukkot following the pilgrims of Temple times.', 'Suitable for kids aged 5 and up.']
      },
      highlights: { he: ['מדרגות העלייה לרגל', 'שוק ארבעת המינים', 'ברכת כוהנים'], en: ['The pilgrims’ steps', 'The Four Species market', 'The Priestly Blessing'] },
      meeting: { place: { he: 'חניון גבעתי, עיר דוד', en: 'Givati parking lot, City of David' }, time: '09:00', lat: 31.7745, lng: 35.2355 },
      included: { he: ['הדרכה'], en: ['Guiding'] },
      notIncluded: { he: ['כניסה לעיר דוד'], en: ['City of David entry'] },
      images: ['1552423314-cf29ab68ad73', '1547483238-2cbf881a559f'],
      theme: 'jerusalem',
      // ⚠ דוגמה לטיול שעבר – לא יוצג ברשימות
      dates: [day(-20), day(-17)]
    }
  ];

  /* ---------------- חוות דעת (בדויות) ----------------
     n = שם הכותב/ת, r = ציון 1–5, d = תאריך, l = שפת הביקורת, t = טקסט
  ---------------------------------------------------- */
  const REVIEWS = {
    'oct7-he': [
      { n: 'מיכל ש.', r: 5, d: day(-9), l: 'he', t: 'סיור מטלטל וחשוב. אורי הדריך ברגישות עצומה, והמפגש עם התושבת בכפר עזה היה הרגע הכי חזק ביום.' },
      { n: 'יוסי ק.', r: 5, d: day(-16), l: 'he', t: 'כל ישראלי צריך לעשות את הסיור הזה. מאורגן מצוין, מהאוטובוס ועד הארוחה אצל המשפחה.' },
      { n: 'רונית א.', r: 4, d: day(-23), l: 'he', t: 'חוויה חשובה מאוד. היה קצת צפוף בזמנים, הייתי שמחה לעוד זמן באתר הנובה.' },
      { n: 'אבי ג.', r: 5, d: day(-30), l: 'he', t: 'מדריך מקצועי שיודע לשלב את הסיפור האישי עם התמונה הרחבה. ממליץ בחום.' },
      { n: 'שירה מ.', r: 5, d: day(-44), l: 'he', t: 'בכינו, למדנו ויצאנו עם תחושת שליחות. תודה.' },
      { n: 'דני ר.', r: 4, d: day(-51), l: 'he', t: 'מעולה. ההערה היחידה: נקודת האיסוף בסבידור לא הייתה מסומנת היטב.' }
    ],
    'oct7-en': [
      { n: 'Rachel M.', r: 5, d: day(-8), l: 'en', t: 'The most meaningful day of our trip to Israel. Uri gave context without politics and let the residents speak.' },
      { n: 'David K.', r: 5, d: day(-19), l: 'en', t: 'Our synagogue group of 28 came back changed. Professional, respectful and very well organised.' },
      { n: 'Sarah L.', r: 4, d: day(-33), l: 'en', t: 'Powerful and important. A long day – bring water and a hat.' },
      { n: 'Michael B.', r: 5, d: day(-47), l: 'en', t: 'Everyone visiting Israel should do this. Thank you for keeping the stories alive.' }
    ],
    'jerusalem-conflict': [
      { n: 'Tom H.', r: 5, d: day(-5), l: 'en', t: 'Finally understood the map of Jerusalem. Balanced, honest and fascinating.' },
      { n: 'נעמה ב.', r: 5, d: day(-12), l: 'he', t: 'חשבתי שאני מכירה את ירושלים, וגיליתי עיר אחרת לגמרי. מומלץ מאוד.' },
      { n: 'Anna P.', r: 4, d: day(-26), l: 'en', t: 'Excellent content, lots of walking. Wear good shoes!' },
      { n: 'גיל ד.', r: 3, d: day(-40), l: 'he', t: 'מעניין, אבל הייתי רוצה פחות עמידה בתצפיות ויותר מפגשים עם אנשים.' },
      { n: 'Lisa W.', r: 5, d: day(-61), l: 'en', t: 'Uri welcomed every question, even the uncomfortable ones. Highly recommended for first-time visitors.' }
    ],
    'jerusalem-family': [
      { n: 'הדס ל.', r: 5, d: day(-7), l: 'he', t: 'הילדים (7 ו-10) לא הפסיקו לדבר על משימת החוקרים! יעל פשוט קוסמת.' },
      { n: 'עומר נ.', r: 5, d: day(-14), l: 'he', t: 'הסיור הכי טוב שעשינו עם הילדים. קצב נכון, הרבה הפסקות והרבה צחוק.' },
      { n: 'Jenny F.', r: 4, d: day(-28), l: 'en', t: 'Great for our kids. The ramparts walk is not stroller-friendly though – leave it at the hotel.' },
      { n: 'ליאת ס.', r: 5, d: day(-35), l: 'he', t: 'גם סבא וסבתא נהנו. נחזור לסיור המשפחות בצפון.' },
      { n: 'משה ט.', r: 4, d: day(-49), l: 'he', t: 'כיף גדול. היה חם, כדאי להביא כובעים.' },
      { n: 'קרן י.', r: 5, d: day(-63), l: 'he', t: 'ממליצה לכל משפחה. הפרס בסוף ריגש את הקטנה.' },
      { n: 'Paul D.', r: 5, d: day(-70), l: 'en', t: 'Yael made history fun for teenagers – no small feat!' }
    ],
    'carmel-market': [
      { n: 'Emily R.', r: 5, d: day(-3), l: 'en', t: 'Best food tour I have done anywhere in the world. The malawach! The stories!' },
      { n: 'אורית ח.', r: 5, d: day(-10), l: 'he', t: 'יצאנו מפוצצים ומאושרים. יעל מכירה כל מוכר בשוק.' },
      { n: 'Marco G.', r: 4, d: day(-17), l: 'en', t: 'Delicious and fun. A bit crowded on a Friday – pick a weekday if you can.' },
      { n: 'רועי פ.', r: 5, d: day(-24), l: 'he', t: 'מתנת יום הולדת מושלמת. קבוצה קטנה ואווירה מעולה.' },
      { n: 'Hannah S.', r: 5, d: day(-31), l: 'en', t: 'Great vegetarian options. We went back to buy spices the next day.' },
      { n: 'תמר ו.', r: 3, d: day(-45), l: 'he', t: 'הטעימות טובות, אבל חלק מהתחנות היו קצרות מדי ולא הספקנו לשמוע את הסיפור.' },
      { n: 'Ben C.', r: 5, d: day(-52), l: 'en', t: 'Come hungry. Seriously.' },
      { n: 'אלון ז.', r: 4, d: day(-66), l: 'he', t: 'מומלץ. הקינוח המפתיע בסוף שווה את כל הסיור.' }
    ],
    'tzadikim': [
      { n: 'שמעון א.', r: 5, d: day(-6), l: 'he', t: 'דוד מדריך מהלב. הסיפורים על האר״י בצפת ריגשו את כולנו.' },
      { n: 'Sophie L.', r: 5, d: day(-20), l: 'fr', t: 'Merveilleuse journée, David explique tout en français avec beaucoup de chaleur.' },
      { n: 'רחל כ.', r: 4, d: day(-34), l: 'he', t: 'יום ארוך אבל מרומם. הייתי שמחה לעוד זמן בעמוקה.' },
      { n: 'יצחק מ.', r: 5, d: day(-48), l: 'he', t: 'ארגון מושלם והסעודה בצפת הייתה מצוינת.' }
    ],
    'northern-border': [
      { n: 'עידו ב.', r: 5, d: day(-11), l: 'he', t: 'רון מסביר את המציאות בצפון בצורה בהירה ומרתקת. התצפית מהר אדיר מטורפת.' },
      { n: 'Karen T.', r: 4, d: day(-25), l: 'en', t: 'Very informative. Long drive, but worth it.' },
      { n: 'מירב ש.', r: 5, d: day(-39), l: 'he', t: 'המפגש עם התושבים במטולה היה מרגש מאוד.' },
      { n: 'אריה ל.', r: 4, d: day(-53), l: 'he', t: 'סיור טוב. חבל שלא היה זמן לרכבל בראש הנקרה.' },
      { n: 'James O.', r: 5, d: day(-67), l: 'en', t: 'Eye-opening. Ron knows every hill and every story.' }
    ],
    'jezreel-kings': [
      { n: 'אסף ר.', r: 5, d: day(-4), l: 'he', t: 'נועה מחזירה את התנ״ך לחיים. מפעל המים במגידו – וואו.' },
      { n: 'דפנה ע.', r: 5, d: day(-18), l: 'he', t: 'סוף סוף מבינים למה כולם נלחמו על העמק הזה.' },
      { n: 'יובל ה.', r: 4, d: day(-32), l: 'he', t: 'מעניין מאוד. הייתי מוסיף הסעה מאורגנת, כי היה מסובך להגיע.' },
      { n: 'ענבל ג.', r: 5, d: day(-46), l: 'he', t: 'מדריכה ברמה אחרת. ידע אדיר ויכולת הסבר נדירה.' },
      { n: 'מאיר ק.', r: 3, d: day(-60), l: 'he', t: 'תוכן מצוין, אבל הקבוצה הייתה גדולה מדי ולא תמיד שמענו.' }
    ],
    'zichron': [
      { n: 'אפרת ד.', r: 5, d: day(-13), l: 'he', t: 'שילוב מושלם של היסטוריה, יין ואוכל. הסיפור על שרה אהרנסון הצמרר.' },
      { n: 'ניר ש.', r: 4, d: day(-27), l: 'he', t: 'כיף של יום. היקב השני היה פחות מרשים מהראשון.' },
      { n: 'גלית מ.', r: 5, d: day(-41), l: 'he', t: 'חגגנו יום נישואים ולא יכולנו לבקש יותר. תודה יעל!' },
      { n: 'בועז ת.', r: 5, d: day(-55), l: 'he', t: 'ממליץ בחום לזוגות ולחברים. אווירה מעולה.' }
    ],
    'selichot': [
      { n: 'חנה פ.', r: 5, d: day(-30), l: 'he', t: 'לילה קסום. הפיוטים בבית הכנסת התימני ליוו אותי כל השבוע.' },
      { n: 'אליהו ב.', r: 5, d: day(-30), l: 'he', t: 'דוד יודע לחבר בין המסורת לאנשים. חוויה של פעם בשנה.' },
      { n: 'שרון ק.', r: 4, d: day(-37), l: 'he', t: 'מרגש מאוד. היה עמוס בכותל, אבל זה חלק מהחוויה.' }
    ],
    'ramon-jeeps': [
      { n: 'Lior A.', r: 5, d: day(-8), l: 'en', t: 'Adrenaline and silence in one day. The sunset coffee was magical.' },
      { n: 'טל ב.', r: 5, d: day(-22), l: 'he', t: 'רון הוא תותח. נהגנו בעצמנו והרגשנו בטוחים לגמרי.' },
      { n: 'אורן מ.', r: 4, d: day(-36), l: 'he', t: 'נופים מדהימים. האוכל בשטח היה בסדר, לא יותר.' },
      { n: 'Nina K.', r: 5, d: day(-50), l: 'en', t: 'Unforgettable landscapes and a great guide.' },
      { n: 'שני ר.', r: 5, d: day(-64), l: 'he', t: 'עשינו את זה כמשפחה עם נערים, וכולם נהנו.' },
      { n: 'עמית ג.', r: 4, d: day(-71), l: 'he', t: 'מומלץ. כדאי לבוא עם ציוד לקור, בערב היה קר מאוד.' }
    ],
    'petra': [
      { n: 'מורן ל.', r: 5, d: day(-15), l: 'he', t: 'חלום שהתגשם. רון דאג לכל פרט במעבר הגבול.' },
      { n: 'Steve P.', r: 4, d: day(-29), l: 'en', t: 'Petra is spectacular. Very long day – be prepared.' },
      { n: 'ליה ש.', r: 5, d: day(-43), l: 'he', t: 'ארגון מושלם, מדריך מקומי נהדר, והחזנה מורידה את הלסת.' },
      { n: 'יגאל נ.', r: 3, d: day(-57), l: 'he', t: 'האתר מדהים, אבל חיכינו יותר משעה במעבר הגבול.' },
      { n: 'Claire D.', r: 5, d: day(-72), l: 'en', t: 'Worth every step up to the Monastery!' }
    ],
    'sinai': [
      { n: 'אלעד ר.', r: 5, d: day(-21), l: 'he', t: 'הזריחה מהר משה היא אחד הרגעים היפים בחיי.' },
      { n: 'נגה ב.', r: 4, d: day(-49), l: 'he', t: 'מסע מיוחד. הלינה בסיסית מאוד, אבל זה חלק מהקסם.' },
      { n: 'רז ק.', r: 5, d: day(-77), l: 'he', t: 'רון והמדריך הבדואי – צוות מנצח.' }
    ],
    'sukkot-jerusalem': [
      { n: 'אביטל ח.', r: 5, d: day(-17), l: 'he', t: 'סיור חגיגי ומקסים. הילדים בחרו לולב בעצמם!' },
      { n: 'יונתן צ.', r: 4, d: day(-17), l: 'he', t: 'מומלץ, אבל עמוס מאוד בחול המועד.' },
      { n: 'מעיין ד.', r: 5, d: day(-20), l: 'he', t: 'נועה מדריכה מעולה לילדים ולמבוגרים.' }
    ]
  };

  /* ---------------- כתבות מגזין (לדוגמה) ---------------- */
  const ARTICLES = [
    {
      id: 'hanukkah',
      date: day(-2),
      author: 'david',
      image: '1547483238-2cbf881a559f',
      theme: 'jerusalem',
      trip: 'jerusalem-family',
      category: { he: 'חגים', en: 'Holidays' },
      title: { he: 'חנוכה מתקרב: 5 מסלולי אורות בירושלים לכל המשפחה', en: 'Hanukkah Is Coming: 5 Jerusalem Light Trails for the Whole Family' },
      excerpt: {
        he: 'מחנוכיות על חלונות נחלאות ועד מנהרות הכותל: איפה לראות את האורות השנה, ואיך עושים את זה עם ילדים.',
        en: 'From menorahs in the windows of Nachlaot to the Western Wall tunnels: where to see the lights this year, and how to do it with kids.'
      },
      body: {
        he: [
          'חנוכה הוא אולי החג היפה ביותר לטייל בו בירושלים. עם רדת החשכה נדלקות חנוכיות בקופסאות זכוכית בפתחי הבתים, כמנהג העתיק להדליק "על פתח ביתו מבחוץ".',
          '1. נחלאות: סמטאות צרות, חנוכיות בכל חלון ובתי כנסת קטנים שבהם מדליקים בשירה. 2. הרובע היהודי: הדלקה מרכזית ברחבת הכותל. 3. מנהרות הכותל: מסע תת-קרקעי לימי המקבים. 4. עיר דוד: סיור לילי עם פנסים. 5. שכונת מאה שערים: מנהגי חסידויות שונות (בלבוש צנוע ובכבוד למקום).',
          'טיפ למשפחות: כדאי להגיע מוקדם, כחצי שעה לפני השקיעה, כדי לראות את ההכנות. קחו מעילים, כי בירושלים בדצמבר קר.',
          'בחנוכה אנחנו מוסיפים מועדים מיוחדים לסיור "ירושלים לכל המשפחה". כדאי להירשם מוקדם, כי המקומות נגמרים מהר.'
        ],
        en: [
          'Hanukkah may be the most beautiful holiday to explore Jerusalem. As darkness falls, menorahs in glass boxes are lit at doorways, following the ancient custom of lighting “at the entrance of one’s home, outside”.',
          '1. Nachlaot: narrow alleys, menorahs in every window and small synagogues lighting with song. 2. The Jewish Quarter: the central lighting at the Western Wall plaza. 3. The Western Wall tunnels: an underground journey to the days of the Maccabees. 4. City of David: a night tour with lanterns. 5. Mea She’arim: the customs of different Hasidic courts (dress modestly and respectfully).',
          'Tip for families: arrive about half an hour before sunset to watch the preparations. Bring coats – Jerusalem is cold in December.',
          'Over Hanukkah we add special departures of “Jerusalem for the Whole Family”. Book early – places go fast.'
        ]
      }
    },
    {
      id: 'upper-galilee',
      date: day(-6),
      author: 'noa',
      image: '1441974231531-c6227db76b6e',
      theme: 'north',
      trip: 'northern-border',
      category: { he: 'יעדים', en: 'Destinations' },
      title: { he: 'הגליל העליון בסתיו: 3 מסלולים קלים עם נוף שעוצר את הנשימה', en: 'The Upper Galilee in Autumn: 3 Easy Trails with Breathtaking Views' },
      excerpt: {
        he: 'הצפון חוזר לחיים, והסתיו הוא הזמן המושלם: נחל עיון, הר מירון ותצפית מנרה.',
        en: 'The north is coming back to life, and autumn is the perfect time: Nahal Iyun, Mount Meron and the Manara lookout.'
      },
      body: {
        he: [
          'אחרי תקופה קשה, הגליל העליון מחכה למטיילים. העסקים המקומיים פתוחים, השבילים מסומנים, והסתיו צובע את ההרים בירוק ראשון.',
          'נחל עיון: מסלול של כשעה וחצי, מתאים לילדים, עם מפל התנור בסופו. הר מירון: שביל ההקפה, עם נוף לכל הגליל ויער אלונים עתיק. תצפית מנרה: מבט על עמק החולה ועל רמת הגולן, מושלם לשקיעה.',
          'לפני כל יציאה צפונה, בדקו את הנחיות פיקוד העורף. ובדרך עצרו לקנות מהחקלאים המקומיים: זו הדרך הכי טובה לחזק את הצפון.'
        ],
        en: [
          'After a difficult period, the Upper Galilee is waiting for visitors. Local businesses are open, trails are marked and autumn paints the hills with the first green.',
          'Nahal Iyun: about an hour and a half, kid-friendly, ending at the Tanur waterfall. Mount Meron: the loop trail, with views over the whole Galilee and an ancient oak forest. Manara lookout: a view of the Hula Valley and the Golan Heights, perfect at sunset.',
          'Before heading north, check the Home Front Command guidelines. And on the way, buy from local farmers – it’s the best way to support the north.'
        ]
      }
    },
    {
      id: 'carmel-bites',
      date: day(-11),
      author: 'yael',
      image: '1488459716781-31db52582fe9',
      theme: 'food',
      trip: 'carmel-market',
      category: { he: 'קולינריה', en: 'Food' },
      title: { he: '10 ביסים שאסור לפספס בשוק הכרמל', en: '10 Bites You Must Not Miss at the Carmel Market' },
      excerpt: {
        he: 'המדריכה הקולינרית שלנו חושפת את הדוכנים שהיא חוזרת אליהם שוב ושוב.',
        en: 'Our culinary guide reveals the stalls she keeps going back to.'
      },
      body: {
        he: [
          'אחרי מאות סיורים בשוק, יש דוכנים שאני פשוט לא מסוגלת לעבור לידם בלי לעצור. הנה הרשימה האישית שלי.',
          'מלאוח טרי עם רסק עגבניות וסחוג, בורקס תורכי יוצא מהתנור, סביח עם עמבה, כנאפה חמה, קפה עם הל, חמוצים בחביות, חלבה בעשרים טעמים, פירות העונה, מאפה בצל ופיתה עם זעתר טרי.',
          'וטיפ אחרון: השוק הכי נעים ביום שלישי בבוקר. ביום שישי עמוס מאוד, אבל האווירה שווה את זה.'
        ],
        en: [
          'After hundreds of market tours, there are stalls I simply cannot walk past without stopping. Here is my personal list.',
          'Fresh malawach with grated tomato and zhug, Turkish bourekas straight from the oven, sabich with amba, hot knafeh, cardamom coffee, pickles from the barrel, halva in twenty flavours, seasonal fruit, onion pastry and pita with fresh za’atar.',
          'One last tip: the market is most pleasant on a Tuesday morning. Friday is packed, but the atmosphere is worth it.'
        ]
      }
    },
    {
      id: 'visiting-envelope',
      date: day(-16),
      author: 'uri',
      image: '1500382017468-9049fed747ef',
      theme: 'south',
      trip: 'oct7-he',
      category: { he: 'זיכרון ומורשת', en: 'Remembrance' },
      title: { he: 'לבקר בעוטף עזה: למה, איך, ומה חשוב לדעת', en: 'Visiting the Gaza Envelope: Why, How and What to Know' },
      excerpt: {
        he: 'שאלות ותשובות על ביקור רגיש ומשמעותי: כללי התנהגות, ביטחון, ואיך הביקור עוזר לקהילות.',
        en: 'Questions and answers about a sensitive, meaningful visit: etiquette, safety and how your visit helps the communities.'
      },
      body: {
        he: [
          'אנשים רבים שואלים אותי אם "מותר" לבקר בעוטף. התשובה של התושבים ברורה: הם רוצים שנבוא, שנשמע ושנספר הלאה. אבל חשוב לעשות את זה נכון.',
          'כללי התנהגות: מבקשים רשות לפני שמצלמים אנשים, לא מצלמים סלפי באתרי ההנצחה, ומקשיבים יותר משמדברים. לבוש: נוח ומכבד.',
          'ביטחון: הסיורים מתקיימים רק באישור צה״ל והרשויות המקומיות, והמסלול מתעדכן לפי המצב. לכל קבוצה יש תדריך ביטחון.',
          'איך זה עוזר: אנחנו קונים מעסקים מקומיים, אוכלים אצל משפחות ומעבירים חלק מההכנסות לקהילות. ובעיקר, הסיפור ממשיך להיות מסופר.'
        ],
        en: [
          'Many people ask me whether it is “okay” to visit the envelope. The residents’ answer is clear: they want us to come, to listen and to pass the story on. But it matters to do it right.',
          'Etiquette: ask permission before photographing people, no selfies at memorial sites, and listen more than you talk. Dress: comfortable and respectful.',
          'Safety: tours run only with approval from the IDF and local authorities, and the route is updated according to the situation. Every group gets a security briefing.',
          'How it helps: we buy from local businesses, eat with local families and give part of the proceeds to the communities. Above all, the story keeps being told.'
        ]
      }
    }
  ];

  window.TDI_DATA = { SITE, GUIDES, TRIPS, REVIEWS, ARTICLES, day };
})();
