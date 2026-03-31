import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ik_language";

const dictionaries = {
  en: {
    navExplore: "Explore",
    navDiscover: "Discover",
    navItinerary: "Itinerary",
    navSaved: "Saved",
    navMap: "Map",
    navProfile: "Profile",
    navDashboard: "Overview",
    navApprovals: "Approvals",
    navListings: "Manage Places",
    navSubmitPlace: "Add Place",
    navMySubmissions: "My Submissions",
    navAnalytics: "Insights",
    navUsers: "Users",
    navSettings: "Settings",
    logout: "Logout",
    greeting: "Namaste",
    greetingSubtitle: "Discover the soul of Karnataka through local experiences.",
    useMyLocation: "Use my location",
    locationActive: "Location active",
    featuredDiscoveries: "Featured Discoveries",
    showAll: "Show all",
    aiGuideTitle: "AI Itinerary Guide",
    aiGuideText: "Let our AI plan your perfect Karnataka weekend getaway based on your interests.",
    profileTitle: "Your Profile",
    profileSubtitle: "Manage your account, saved journeys, and language preferences.",
    accountOverview: "Account Overview",
    savedPlaces: "Saved Places",
    role: "Role",
    language: "Language",
    quickActions: "Quick Actions",
    settings: "Settings",
    notifications: "Notifications",
    travelStyle: "Travel Style",
    signOut: "Sign out",
    itineraryTitle: "Build Your Itinerary",
    itinerarySubtitle: "Choose a district and interests, then we will shape a route around them.",
    chooseDistrict: "Choose district",
    howManyDays: "How many days?",
    preferredCategories: "Preferred categories",
    generatePlan: "Generate Day Plan",
    generatingPlan: "Generating...",
    pickDistrictError: "Choose a district.",
    profileSavedCount: "saved places",
    profileSettingsHint: "Notifications and travel preferences can be expanded next.",
    mapLocationError: "Enable location access to center the map around you.",
    centerOnMe: "Center on me",
  },
  kn: {
    navExplore: "ಅನ್ವೇಷಿಸಿ",
    navDiscover: "ಹುಡುಕಿ",
    navItinerary: "ಪ್ರವಾಸ ಯೋಜನೆ",
    navSaved: "ಉಳಿಸಿದವು",
    navMap: "ನಕ್ಷೆ",
    navProfile: "ಪ್ರೊಫೈಲ್",
    navDashboard: "ಅವಲೋಕನ",
    navApprovals: "ಅನುಮೋದನೆಗಳು",
    navListings: "ಸ್ಥಳ ನಿರ್ವಹಣೆ",
    navSubmitPlace: "ಸ್ಥಳ ಸೇರಿಸಿ",
    navMySubmissions: "ನನ್ನ ಸಲ್ಲಿಕೆಗಳು",
    navAnalytics: "ಅವಲೋಕನೆಗಳು",
    navUsers: "ಬಳಕೆದಾರರು",
    navSettings: "ಸೆಟ್ಟಿಂಗ್ಗಳು",
    logout: "ಲಾಗ್ ಔಟ್",
    greeting: "ನಮಸ್ತೆ",
    greetingSubtitle: "ಸ್ಥಳೀಯ ಅನುಭವಗಳ ಮೂಲಕ ಕರ್ನಾಟಕದ ಆತ್ಮವನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ.",
    useMyLocation: "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ",
    locationActive: "ಸ್ಥಳ ಸಕ್ರಿಯ",
    featuredDiscoveries: "ಮುಖ್ಯ ಅನ್ವೇಷಣೆಗಳು",
    showAll: "ಎಲ್ಲವನ್ನೂ ನೋಡಿ",
    aiGuideTitle: "ಎಐ ಪ್ರವಾಸ ಮಾರ್ಗದರ್ಶಿ",
    aiGuideText: "ನಿಮ್ಮ ಆಸಕ್ತಿಗಳ ಆಧಾರದ ಮೇಲೆ ಕರ್ನಾಟಕದ ಪರಿಪೂರ್ಣ ವೀಕೆಂಡ್ ಪ್ರವಾಸವನ್ನು ನಾವು ರೂಪಿಸುತ್ತೇವೆ.",
    profileTitle: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್",
    profileSubtitle: "ನಿಮ್ಮ ಖಾತೆ, ಉಳಿಸಿದ ಪ್ರವಾಸಗಳು ಮತ್ತು ಭಾಷಾ ಆಯ್ಕೆಯನ್ನು ನಿರ್ವಹಿಸಿ.",
    accountOverview: "ಖಾತೆ ಅವಲೋಕನ",
    savedPlaces: "ಉಳಿಸಿದ ಸ್ಥಳಗಳು",
    role: "ಪಾತ್ರ",
    language: "ಭಾಷೆ",
    quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
    settings: "ಸೆಟ್ಟಿಂಗ್ಗಳು",
    notifications: "ಅಧಿಸೂಚನೆಗಳು",
    travelStyle: "ಪ್ರವಾಸ ಶೈಲಿ",
    signOut: "ಲಾಗ್ ಔಟ್",
    itineraryTitle: "ನಿಮ್ಮ ಪ್ರವಾಸ ಯೋಜನೆ ರೂಪಿಸಿ",
    itinerarySubtitle: "ಜಿಲ್ಲೆ ಮತ್ತು ಆಸಕ್ತಿಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ, ನಾವು ಮಾರ್ಗವನ್ನು ರೂಪಿಸುತ್ತೇವೆ.",
    chooseDistrict: "ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ",
    howManyDays: "ಎಷ್ಟು ದಿನಗಳು?",
    preferredCategories: "ಇಷ್ಟದ ವರ್ಗಗಳು",
    generatePlan: "ಯೋಜನೆ ರಚಿಸಿ",
    generatingPlan: "ರಚಿಸಲಾಗುತ್ತಿದೆ...",
    pickDistrictError: "ದಯವಿಟ್ಟು ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    profileSavedCount: "ಉಳಿಸಿದ ಸ್ಥಳಗಳು",
    profileSettingsHint: "ಅಧಿಸೂಚನೆಗಳು ಮತ್ತು ಪ್ರವಾಸ ಆಯ್ಕೆಗಳನ್ನು ಮುಂದೆ ವಿಸ್ತರಿಸಬಹುದು.",
    mapLocationError: "ನಕ್ಷೆಯನ್ನು ನಿಮ್ಮ ಸುತ್ತ ಕೇಂದ್ರಗೊಳಿಸಲು ಸ್ಥಳ ಅನುಮತಿಸಿ.",
    centerOnMe: "ನನ್ನ ಮೇಲೆ ಕೇಂದ್ರಗೊಳಿಸಿ",
  },
  hi: {
    navExplore: "एक्सप्लोर",
    navDiscover: "डिस्कवर",
    navItinerary: "यात्रा योजना",
    navSaved: "सेव्ड",
    navMap: "मैप",
    navProfile: "प्रोफाइल",
    navDashboard: "ओवरव्यू",
    navApprovals: "अप्रूवल",
    navListings: "प्लेस प्रबंधन",
    navSubmitPlace: "प्लेस जोड़ें",
    navMySubmissions: "मेरी सबमिशन",
    navAnalytics: "इनसाइट्स",
    navUsers: "यूज़र्स",
    navSettings: "सेटिंग्स",
    logout: "लॉग आउट",
    greeting: "नमस्ते",
    greetingSubtitle: "स्थानीय अनुभवों के साथ कर्नाटक की असली पहचान खोजिए।",
    useMyLocation: "मेरा लोकेशन इस्तेमाल करें",
    locationActive: "लोकेशन सक्रिय",
    featuredDiscoveries: "फ़ीचर्ड डिस्कवरी",
    showAll: "सब देखें",
    aiGuideTitle: "एआई यात्रा गाइड",
    aiGuideText: "आपकी पसंद के आधार पर हम कर्नाटक का शानदार वीकेंड प्लान तैयार करेंगे।",
    profileTitle: "आपकी प्रोफाइल",
    profileSubtitle: "अपना अकाउंट, सेव्ड ट्रिप्स और भाषा सेटिंग्स संभालें।",
    accountOverview: "अकाउंट ओवरव्यू",
    savedPlaces: "सेव्ड प्लेसेस",
    role: "रोल",
    language: "भाषा",
    quickActions: "क्विक एक्शंस",
    settings: "सेटिंग्स",
    notifications: "नोटिफिकेशन",
    travelStyle: "ट्रैवल स्टाइल",
    signOut: "लॉग आउट",
    itineraryTitle: "अपनी यात्रा योजना बनाएं",
    itinerarySubtitle: "जिला और रुचियां चुनिए, हम उसी हिसाब से प्लान बनाएंगे।",
    chooseDistrict: "जिला चुनें",
    howManyDays: "कितने दिन?",
    preferredCategories: "पसंदीदा कैटेगरी",
    generatePlan: "डे प्लान बनाएं",
    generatingPlan: "बनाया जा रहा है...",
    pickDistrictError: "कृपया एक जिला चुनें।",
    profileSavedCount: "सेव्ड प्लेसेस",
    profileSettingsHint: "नोटिफिकेशन और ट्रैवल प्रेफरेंस को आगे और बेहतर किया जा सकता है।",
    mapLocationError: "मैप को आपकी जगह पर केंद्रित करने के लिए लोकेशन अनुमति दें।",
    centerOnMe: "मेरे ऊपर केंद्रित करें",
  },
};

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

function getInitialLanguage() {
  if (typeof localStorage === "undefined") {
    return "en";
  }
  return localStorage.getItem(STORAGE_KEY) || "en";
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key, fallback) => dictionaries[language]?.[key] || dictionaries.en[key] || fallback || key,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
