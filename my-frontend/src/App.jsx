import { useEffect, useRef, useState } from "react";
import "./App.css";

function VideoFeed({ isOn, onReady }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let stream;
    async function enableCam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Let parent know when video is ready (for future pose/angles processing)
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            onReady?.(videoRef.current);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        alert("Could not access camera. Check permissions and reload.");
      }
    }

    if (isOn) enableCam();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isOn, onReady]);

  return (
    <div className="card video-card">
      <video ref={videoRef} playsInline muted className="video" />
      {/* Optional: overlay canvas for keypoints/skeleton later */}
      {/* <canvas className="overlay" /> */}
    </div>
  );
}

function AngleOutputPanel({ angles }) {
  return (
    <div className="card panel">
      <div className="panel-header">Joint Angles</div>
      <div className="panel-body">
        {angles.length === 0 ? (
          <div className="empty">No angles yet, need to fill</div>
        ) : (
          <ul className="angles-list">
            {angles.map((a, i) => (
              <li key={i}>
                <span>{a.label}</span>
                <strong>{a.value.toFixed(1)}°</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FeedbackPanel({ messages }) {
  return (
    <div className="card panel">
      <div className="panel-header">Form Feedback</div>
      <div className="panel-body">
        {messages.length === 0 ? (
          <div className="empty">No feedback yet, need to fill</div>
        ) : (
          <ul className="feedback-list">
            {messages.map((m, i) => (
              <li key={i} className={`feedback-item ${m.type}`}>{m.text}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TierBadge({ tier }) {
  return (
    <div className="tier-badge">
      <div className="tier-label">Tier</div>
      <div className="tier-value">{tier ?? "—"}</div>
    </div>
  );
}

function ModelSelector({ model, setModel, running, setRunning }) {
  const models = ["Baseline", "MoveNet", "BlazePose", "PoseNet"]; // placeholders for later swap
  return (
    <div className="card panel">
      <div className="panel-header">Model Selector</div>
      <div className="panel-body model-row">
        <select
          className="select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={running}
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? "Stop" : "Start"}
        </button>
      </div>
      <p className="muted">Swap between models for testing</p>
    </div>
  );
}

export default function App() {
  const [cameraOn, setCameraOn] = useState(true);
  const [model, setModel] = useState("Baseline");
  const [modelRunning, setModelRunning] = useState(false);
  const [tier, setTier] = useState(null);

  // Placeholder demo data
  const [angles, setAngles] = useState([]);
  const [feedback, setFeedback] = useState([]);

  // When video is ready you can hook your pose/angles pipelines here
  const handleVideoReady = (videoEl) => {
    // Example: warm-up or initialize model with videoEl
    // For now we’ll just mock some values when "modelRunning" toggles.
  };

  // Mock angle + feedback updates while model is "running"
  useEffect(() => {
    let interval;
    if (modelRunning) {
      interval = setInterval(() => {
        setAngles([
          { label: "Left Knee", value: 165 + Math.random() * 10 - 5 },
          { label: "Right Knee", value: 168 + Math.random() * 10 - 5 },
          { label: "Left Elbow", value: 90 + Math.random() * 6 - 3 },
        ]);
        setFeedback((prev) => {
          const msgs = [
            { type: "ok", text: "Back looks neutral." },
            { type: "warn", text: "Keep knees tracking over toes." },
            { type: "info", text: "Nice depth. Maintain tempo." },
          ];
          // rotate a message for demo
          const next = msgs[Math.floor(Math.random() * msgs.length)];
          return [next, ...prev].slice(0, 5);
        });
        // Simple demo “tier” logic
        setTier(["Bronze", "Silver", "Gold"][Math.floor(Math.random() * 3)]);
      }, 1200);
    } else {
      setAngles([]);
      setFeedback([]);
      setTier(null);
    }
    return () => clearInterval(interval);
  }, [modelRunning]);

  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href="https://gorillamode.app/" target="_blank" rel="noreferrer">
          Gorilla Mode
        </a>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => setCameraOn((v) => !v)}>
            {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
          </button>
        </div>
      </header>

      <main className="app-grid">
        {/* Left column */}
        <section className="left-col">
          <VideoFeed isOn={cameraOn} onReady={handleVideoReady} />
          <AngleOutputPanel angles={angles} />
          <FeedbackPanel messages={feedback} />
        </section>

        {/* Right column */}
        <aside className="right-col">
          <TierBadge tier={tier} />
          <ModelSelector
            model={model}
            setModel={setModel}
            running={modelRunning}
            setRunning={setModelRunning}
          />
          <div className="card panel">
            <div className="panel-header">Session Notes</div>
            <div className="panel-body">
              <p className="muted">Placeholder for timers, reps, etc.</p>
            </div>
          </div>
        </aside>
      </main>
      <footer className="app-footer">© {new Date().getFullYear()} Gorilla Mode</footer>
    </div>
  );
}