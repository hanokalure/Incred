import { Provider } from "react-redux";
import { store } from "./src/store";
import RootNavigator from "./src/navigation/RootNavigator";
import NotificationListener from "./src/components/NotificationListener";
import "./src/styles/leaflet-expo.css";
import "./src/styles/leaflet-markers.css";
import { LanguageProvider } from "./src/context/LanguageContext";

export default function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <NotificationListener />
        <RootNavigator />
      </LanguageProvider>
    </Provider>
  );
}
