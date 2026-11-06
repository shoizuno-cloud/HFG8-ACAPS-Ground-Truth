import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { mock } from "./api";
import { ExpertCard } from "./ExpertCard";
import { LiveWorkspace, Frame } from "./LiveWorkspace";
const Stage = lazy(() =>
  import("./Extras").then((m) => ({ default: m.Stage })),
);
const Calibration = lazy(() =>
  import("./Extras").then((m) => ({ default: m.Calibration })),
);
const Radar = lazy(() => import("./Radar").then((m) => ({ default: m.Radar })));
import { Apply, Committee } from "./Gateway";
import "./theme.css";
import "./styles.css";
import "./workspace.css";
import "./polish.css";
import "./v2.css";

const MockWorkspace = lazy(() =>
  import("./Workspace").then((m) => ({ default: m.Workspace })),
);
class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <Frame
        title="This view could not load"
        subtitle="The response may not match the current contract."
      >
        <p role="alert">
          Refresh to retry. Unsaved inputs may need to be entered again.
        </p>
        <button onClick={() => location.reload()}>Reload page</button>
      </Frame>
    ) : (
      this.props.children
    );
  }
}
const Impact = lazy(() =>
  import("./Impact").then((m) => ({ default: m.Impact })),
);
function Router() {
  const path = location.pathname;
  if (path === "/" || path === "/radar") return <Radar />;
  if (path === "/desk" || path === "/ledger") {
    const page = path === "/desk" ? "desk" : "ledger";
    return mock ? <MockWorkspace page={page} /> : <LiveWorkspace page={page} />;
  }
  if (path === "/stage") return <Stage />;
  if (path === "/apply") return <Apply />;
  if (path === "/committee") return <Committee />;
  const expert = /^\/e\/([^/]+)\/?$/.exec(path);
  if (expert) return <ExpertCard token={expert[1]} />;
  const impact = /^\/me\/([^/]+)\/impact\/?$/.exec(path);
  if (impact) return <Impact token={impact[1]} />;
  const calibration = /^\/me\/([^/]+)\/calibration\/?$/.exec(path);
  if (calibration) return <Calibration token={calibration[1]} />;
  return (
    <Frame
      title="Page not found"
      subtitle="Open Risk Radar to find the right view."
    >
      <a href="/">Go to Risk Radar</a>
    </Frame>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Boundary>
      <Suspense
        fallback={
          <div className="workspace" role="status">
            Opening workspace…
          </div>
        }
      >
        <Router />
      </Suspense>
    </Boundary>
  </React.StrictMode>,
);
