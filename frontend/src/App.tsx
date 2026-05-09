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
    dayFrom: params.get("from") || params.get("day") || todayIso(),
    dayTo: params.get("to") || params.get("day") || params.get("from") || todayIso(),
    app: params.get("app") || "",
    api: params.get("api") || ""
  };
}

export default function App() {
  const initialRoute = readRoute();
  const [dayFrom, setDayFrom] = useState(initialRoute.dayFrom);
  const [dayTo, setDayTo] = useState(initialRoute.dayTo);
  const [selectedAppName, setSelectedAppName] = useState(initialRoute.app);
  const [selectedApiName, setSelectedApiName] = useState(initialRoute.api);
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  function syncRoute(nextFrom: string, nextTo: string, nextApp: string, nextApi: string) {
    const params = new URLSearchParams();
    params.set("from", nextFrom);
    params.set("to", nextTo);
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
      setDayFrom(route.dayFrom);
      setDayTo(route.dayTo);
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
          dayFrom={dayFrom}
          dayTo={dayTo}
          initialAppName={selectedAppName}
          initialApiName={selectedApiName}
          onBack={() => {
            setSelectedAppName("");
            setSelectedApiName("");
            syncRoute(dayFrom, dayTo, "", "");
          }}
          onScopeChange={(nextApp, nextApi) => {
            setSelectedAppName(nextApp);
            setSelectedApiName(nextApi);
            syncRoute(dayFrom, dayTo, nextApp, nextApi);
          }}
          onDayRangeChange={(nextFrom, nextTo) => {
            setDayFrom(nextFrom);
            setDayTo(nextTo);
            syncRoute(nextFrom, nextTo, selectedAppName, selectedApiName);
          }}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        />
      </main>
    </div>
  );
}
