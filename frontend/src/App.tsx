import { useEffect, useState } from "react";
import { TraceLogsScreen } from "./screens/TraceLogsScreen";

type ThemeMode = "light" | "dark";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function readTheme(): ThemeMode {
  const stored = window.localStorage.getItem("trace-dashboard-theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function readRoute() {
  const params = new URLSearchParams(window.location.search);
  return {
    day: params.get("day") || todayIso(),
    app: params.get("app") || "",
    api: params.get("api") || ""
  };
}

export default function App() {
  const initialRoute = readRoute();
  const [day, setDay] = useState(initialRoute.day);
  const [selectedAppName, setSelectedAppName] = useState(initialRoute.app);
  const [selectedApiName, setSelectedApiName] = useState(initialRoute.api);
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  function syncRoute(nextDay: string, nextApp: string, nextApi: string) {
    const params = new URLSearchParams();
    params.set("day", nextDay);
    if (nextApp) {
      params.set("app", nextApp);
    }
    if (nextApi) {
      params.set("api", nextApi);
    }
    const query = params.toString();
    window.history.pushState({}, "", query ? `?${query}` : window.location.pathname);
  }

  useEffect(() => {
    const handlePopState = () => {
      const route = readRoute();
      setDay(route.day);
      setSelectedAppName(route.app);
      setSelectedApiName(route.api);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("trace-dashboard-theme", theme);
    document.documentElement.style.colorScheme = theme;
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add(`theme-${theme}`);
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <div className={`app-shell theme-${theme}`}>
      <main className="main-shell detail-mode">
        <TraceLogsScreen
          day={day}
          initialAppName={selectedAppName}
          initialApiName={selectedApiName}
          onBack={() => {
            setSelectedAppName("");
            setSelectedApiName("");
            syncRoute(day, "", "");
          }}
          onScopeChange={(nextApp, nextApi) => {
            setSelectedAppName(nextApp);
            setSelectedApiName(nextApi);
            syncRoute(day, nextApp, nextApi);
          }}
          onDayChange={(nextDay) => {
            setDay(nextDay);
            syncRoute(nextDay, selectedAppName, selectedApiName);
          }}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        />
      </main>
    </div>
  );
}
