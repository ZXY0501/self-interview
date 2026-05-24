import { useState, useEffect, useCallback } from "react";

// ── 配置 ──
const API_BASE = "https://self-inview-api-shenke-roybnkjiaw.cn-hangzhou.fcapp.run";

// ── 阶段常量 ──
const PHASES = [
  { name: "觉察阶段", days: [1, 7], desc: "日常发生了什么，感觉如何" },
  { name: "模式阶段", days: [8, 14], desc: "发现自己哪些重复行为" },
  { name: "价值观阶段", days: [15, 21], desc: "真正在乎什么" },
  { name: "恐惧阶段", days: [22, 30], desc: "不敢承认的是什么" },
];

function getPhase(day) {
  return PHASES.find((p) => day >= p.days[0] && day <= p.days[1]) || PHASES[0];
}

// ── 本地存储 ──
const STORAGE_KEY = "selfInterview_v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initData() {
  return {
    startDate: new Date().toISOString().slice(0, 10),
    lastActiveDay: 0,
    days: {},
    historySummary: "",
  };
}

// ── API 调用 ──
async function callAPI(endpoint, body) {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function generateQuestions(day, phase, historySummary) {
  const data = await callAPI("generate-questions", { day, phase, historySummary });
  if (!data.success) throw new Error(data.message);
  return data.questions;
}

async function generateMirror(answers) {
  const data = await callAPI("generate-mirror", { answers });
  if (!data.success) throw new Error(data.message);
  return data.mirror;
}

async function generateSummary(existingSummary, day, answers) {
  const data = await callAPI("generate-summary", { existingSummary, day, answers });
  if (!data.success) throw new Error(data.message);
  return data.summary;
}

// ── 样式 ──
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #111111;
    --bg2: #1a1a1a;
    --bg3: #222222;
    --border: rgba(255,255,255,0.08);
    --text: #e8e4dc;
    --text-dim: rgba(232,228,220,0.50);
    --text-faint: rgba(232,228,220,0.28);
    --accent: #c8b99a;
    --accent-dim: rgba(200,185,154,0.5);
    --accent-blue: #8F9DC3;
    --accent-blue-dim: rgba(143, 157, 195, 0.4);
    --font: 'Noto Serif SC', 'KaiTi', 'SimSun', serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  #root { min-height: 100vh; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInSlow {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.9; }
  }

  .fade-in  { animation: fadeIn 0.6s ease both; }
  .fade-in-2 { animation: fadeIn 0.6s 0.15s ease both; }
  .fade-in-3 { animation: fadeIn 0.6s 0.3s ease both; }
  .fade-in-4 { animation: fadeIn 0.6s 0.45s ease both; }
  .fade-in-5 { animation: fadeIn 0.6s 0.6s ease both; }

  .page {
    max-width: 480px;
    margin: 0 auto;
    padding: 48px 24px 80px;
    min-height: 100vh;
  }

  .welcome-title {
    font-size: 33px;
    font-weight: 300;
    letter-spacing: 0.12em;
    line-height: 1.25;
    text-align: center;
    margin-bottom: 12px;
  }
  .welcome-divider {
    width: 32px;
    height: 1px;
    background: var(--accent-dim);
    margin: 28px auto;
  }
  .welcome-slogan {
    text-align: center;
    color: var(--text-dim);
    font-size: 14px;
    letter-spacing: 0.1em;
    line-height: 2;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 2px;
    margin: 32px 0;
    overflow: hidden;
  }
  .stat-cell {
    background: var(--bg2);
    padding: 16px 18px;
  }
  .stat-cell-right { text-align: right; }
  .stat-number {
    font-size: 26px;
    font-weight: 600;
    color: var(--accent);
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 4px;
  }
  .stat-label {
    font-size: 11px;
    color: var(--text-faint);
    letter-spacing: 0.12em;
    font-weight: 400;
  }

  .cta-card {
    border: 1px solid var(--accent-blue-dim);
    background: var(--bg2);
    border-radius: 2px;
    padding: 20px 24px;
    cursor: pointer;
    transition: border-color 0.3s, background 0.3s;
  }
  .cta-card:hover {
    border-color: var(--accent-blue);
    background: var(--bg3);
  }
  .cta-phase {
    font-size: 11px;
    letter-spacing: 0.18em;
    color: var(--accent-blue);
    margin-bottom: 10px;
    font-weight: 500;
  }
  .cta-text {
    font-size: 18px;
    font-weight: 300;
    color: var(--text);
    letter-spacing: 0.05em;
  }
  .cta-text span { color: var(--accent); }

  .today-done-msg {
    text-align: center;
    color: var(--text-faint);
    font-size: 14px;
    letter-spacing: 0.1em;
    margin-top: 40px;
    line-height: 2.2;
  }
  .nav-links {
    display: flex;
    gap: 32px;
    justify-content: center;
    margin-top: 48px;
  }
  .nav-link {
    font-size: 12px;
    letter-spacing: 0.14em;
    color: var(--text-faint);
    cursor: pointer;
    transition: color 0.2s;
    background: none;
    border: none;
    font-family: var(--font);
  }
  .nav-link:hover { color: var(--text-dim); }

  /* ── 访谈页 ── */
  .interview-header { margin-bottom: 48px; }
  .interview-day-label {
    font-size: 11px;
    letter-spacing: 0.22em;
    color: var(--text-faint);
    margin-bottom: 16px;
  }
  .interview-phase {
    font-size: 13px;
    color: var(--accent-blue);
    letter-spacing: 0.15em;
    font-weight: 500;
  }
  .question-block { margin-bottom: 40px; }
  .question-num {
    font-size: 11px;
    letter-spacing: 0.2em;
    color: var(--text-faint);
    margin-bottom: 14px;
  }
  .question-text {
    font-size: 20px;
    font-weight: 300;
    line-height: 1.7;
    letter-spacing: 0.04em;
    margin-bottom: 20px;
    color: var(--text);
  }
  .answer-input {
    width: 100%;
    background: var(--bg2);
    border: none;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    font-family: var(--font);
    font-size: 15px;
    line-height: 1.8;
    padding: 12px 0;
    resize: none;
    outline: none;
    min-height: 80px;
    letter-spacing: 0.03em;
    transition: border-color 0.3s;
  }
  .answer-input:focus { border-bottom-color: var(--accent-dim); }
  .answer-input::placeholder { color: var(--text-faint); }
  .answer-submitted {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-dim);
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
    letter-spacing: 0.03em;
  }
  .submit-btn-wrap {
    margin-top: 8px;
    display: flex;
    justify-content: flex-end;
  }
  .next-btn {
    background: transparent;
    border: none;
    color: var(--accent);
    font-family: var(--font);
    font-size: 13px;
    letter-spacing: 0.18em;
    cursor: pointer;
    padding: 8px 0;
    transition: opacity 0.2s;
  }
  .next-btn:disabled { opacity: 0.3; cursor: default; }
  .next-btn:not(:disabled):hover { opacity: 0.7; }

  .mirror-wrap {
    margin-top: 56px;
    text-align: center;
    animation: fadeIn 0.8s ease both;
  }
  .mirror-ornament {
    font-size: 10px;
    letter-spacing: 0.3em;
    color: var(--text-faint);
    margin-bottom: 28px;
  }
  .mirror-text {
    font-size: 22px;
    font-weight: 300;
    line-height: 1.8;
    letter-spacing: 0.06em;
    color: var(--accent);
    margin-bottom: 40px;
  }

  .loading-wrap { text-align: center; padding: 80px 0; }
  .loading-dot {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent-dim);
    margin: 0 4px;
    animation: pulse 1.4s ease infinite;
  }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }
  .loading-text {
    margin-top: 20px;
    font-size: 12px;
    letter-spacing: 0.18em;
    color: var(--text-faint);
  }

  /* ── 历史页 ── */
  .page-title {
    font-size: 24px;
    font-weight: 300;
    letter-spacing: 0.12em;
    margin-bottom: 40px;
  }
  .history-item {
    border-bottom: 1px solid var(--border);
    padding: 20px 0;
    cursor: pointer;
  }
  .history-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .history-day { font-size: 14px; letter-spacing: 0.1em; }
  .history-phase { font-size: 11px; color: var(--text-faint); letter-spacing: 0.12em; }
  .history-status-done { font-size: 11px; color: var(--accent-dim); letter-spacing: 0.1em; }
  .history-status-todo { font-size: 11px; color: var(--text-faint); letter-spacing: 0.1em; }
  .history-detail {
    margin-top: 16px;
    overflow: hidden;
    animation: fadeIn 0.3s ease both;
  }
  .history-qa { margin-bottom: 16px; }
  .history-q {
    font-size: 12px;
    color: var(--text-faint);
    letter-spacing: 0.08em;
    margin-bottom: 6px;
    line-height: 1.6;
  }
  .history-a {
    font-size: 14px;
    color: var(--text-dim);
    line-height: 1.8;
    letter-spacing: 0.03em;
  }
  .history-mirror {
    margin-top: 16px;
    padding: 14px 16px;
    background: var(--bg2);
    border-left: 2px solid var(--accent-dim);
    font-size: 13px;
    color: var(--accent-dim);
    letter-spacing: 0.08em;
    line-height: 1.7;
  }

  .backup-section {
    margin-top: 48px;
    border-top: 1px solid var(--border);
    padding-top: 32px;
  }
  .backup-title {
    font-size: 13px;
    letter-spacing: 0.15em;
    color: var(--text-faint);
    margin-bottom: 16px;
  }
  .backup-textarea {
    width: 100%;
    background: var(--bg2);
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-family: monospace;
    font-size: 11px;
    padding: 12px;
    resize: none;
    height: 80px;
    outline: none;
    word-break: break-all;
    line-height: 1.5;
  }
  .btn-row { display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
  .btn-primary {
    display: block;
    width: 100%;
    padding: 16px;
    background: transparent;
    border: 1px solid var(--accent-dim);
    color: var(--accent);
    font-family: var(--font);
    font-size: 14px;
    letter-spacing: 0.18em;
    cursor: pointer;
    transition: background 0.3s, border-color 0.3s;
    text-align: center;
    border-radius: 1px;
  }
  .btn-primary:hover { background: rgba(200,185,154,0.08); border-color: var(--accent); }
  .btn-secondary {
    display: block;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-family: var(--font);
    font-size: 13px;
    letter-spacing: 0.1em;
    cursor: pointer;
    padding: 12px 20px;
    transition: border-color 0.2s, color 0.2s;
    border-radius: 1px;
  }
  .btn-secondary:hover { border-color: var(--text-faint); color: var(--text); }
  .back-btn {
    background: none;
    border: none;
    color: var(--text-faint);
    font-family: var(--font);
    font-size: 12px;
    letter-spacing: 0.15em;
    cursor: pointer;
    padding: 0;
    margin-bottom: 40px;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .back-btn:hover { color: var(--text-dim); }
  .error-msg {
    font-size: 13px;
    color: #c07070;
    letter-spacing: 0.05em;
    line-height: 1.7;
    margin-top: 16px;
  }

  /* ── 弹窗 ── */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    padding: 24px;
    animation: fadeInSlow 0.4s ease;
  }
  .modal {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 40px 32px;
    max-width: 400px;
    width: 100%;
  }
  .modal-title {
    font-size: 22px;
    font-weight: 300;
    letter-spacing: 0.1em;
    margin-bottom: 28px;
    text-align: center;
  }
  .modal-body {
    font-size: 14px;
    color: var(--text-dim);
    line-height: 2;
    letter-spacing: 0.05em;
    margin-bottom: 24px;
  }
  .modal-body p { margin-bottom: 16px; }
  .modal-note {
    font-size: 12px;
    color: var(--text-faint);
    line-height: 1.9;
    border-top: 1px solid var(--border);
    padding-top: 20px;
    margin-bottom: 32px;
    letter-spacing: 0.05em;
  }
`;

// ── 加载动画 ──
function LoadingDots({ text }) {
  return (
    <div className="loading-wrap">
      <div>
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
}

// ── 欢迎弹窗 ──
function OnboardingModal({ onStart }) {
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-title">欢迎</div>
        <div className="modal-body">
          <p>每晚，AI 会问你三个问题。</p>
          <p>你只需要如实回答。</p>
          <p>四周后，你会拿到一份完整的自我记录。</p>
        </div>
        <div className="modal-note">
          所有回答存储在你的设备本地，不上传服务器。只有生成问题时，会将历史摘要发送给 AI 处理。
        </div>
        <button className="btn-primary" onClick={onStart}>准备好了</button>
      </div>
    </div>
  );
}

// ── 欢迎页 ──
function WelcomePage({ data, onStartInterview, onGoHistory }) {
  const completedNights = Object.values(data.days).filter((d) => d.completed).length;
  const currentDay = data.lastActiveDay + 1;
  const todayDone = data.days[currentDay]?.completed;
  const phase = getPhase(currentDay);

  return (
    <div className="page">
      <div className="welcome-title fade-in">三十天<br />自我访谈</div>
      <div className="welcome-divider fade-in-2" />
      <div className="welcome-slogan fade-in-2">
        每晚，与自己相遇<br />在三个问题里，触碰存在的本质
      </div>

      <div className="stats-grid fade-in-3">
        <div className="stat-cell">
          <span className="stat-number">{completedNights}</span>
          <span className="stat-label">已完成的夜晚</span>
        </div>
        <div className="stat-cell stat-cell-right">
          <span className="stat-number" style={{ color: "var(--accent-blue)" }}>{Math.min(currentDay, 30)}</span>
          <span className="stat-label">今晚</span>
        </div>
      </div>

      {currentDay <= 30 && !todayDone ? (
        <div className="cta-card fade-in-4" onClick={onStartInterview}>
          <div className="cta-phase">第 {currentDay} 天 · {phase.name}</div>
          <div className="cta-text">
            {data.lastActiveDay === 0 ? "开始今晚的访谈" : `继续第 ${currentDay} 天的访谈`}
            <span> →</span>
          </div>
        </div>
      ) : todayDone ? (
        <div className="today-done-msg fade-in-4">
          今晚的访谈已完成。<br />
          <span style={{ fontSize: 12, letterSpacing: "0.18em" }}>明天见。</span>
        </div>
      ) : (
        <div className="today-done-msg fade-in-4">
          三十天已完成。<br />
          <span style={{ fontSize: 12, letterSpacing: "0.18em" }}>你已与自己相遇。</span>
        </div>
      )}

      <div className="nav-links fade-in-5">
        <button className="nav-link" onClick={onGoHistory}>历史记录</button>
      </div>
    </div>
  );
}

// ── 访谈页 ──
function InterviewPage({ data, onComplete, onBack }) {
  const currentDay = data.lastActiveDay + 1;
  const phase = getPhase(currentDay);

  const [stage, setStage] = useState("loading");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [currentQ, setCurrentQ] = useState(0);
  const [mirror, setMirror] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    let cancelled = false;
    generateQuestions(currentDay, phase.name, data.historySummary)
      .then((qs) => {
        if (!cancelled) {
          setQuestions(qs);
          setStage("q0");
          setCurrentQ(0);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErrorMsg("生成问题时出错：" + e.message);
          setStage("error");
        }
      });
    return () => { cancelled = true; };
  }, []);

  const submitAnswer = async () => {
    if (!inputVal.trim()) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = inputVal.trim();
    setAnswers(newAnswers);
    setInputVal("");

    if (currentQ < 2) {
      setCurrentQ(currentQ + 1);
      setStage(`q${currentQ + 1}`);
    } else {
      setStage("generating-mirror");
      try {
        const m = await generateMirror(newAnswers);
        const newSummary = await generateSummary(data.historySummary, currentDay, newAnswers);
        setMirror(m);
        setStage("mirror");
        onComplete(currentDay, phase.name, questions, newAnswers, m, newSummary);
      } catch (e) {
        setErrorMsg("生成总结时出错：" + e.message);
        setStage("error");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitAnswer();
  };

  if (stage === "loading") {
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <div className="interview-header">
          <div className="interview-day-label">第 {currentDay} 天</div>
          <div className="interview-phase">{phase.name}</div>
        </div>
        <LoadingDots text="正在准备今晚的问题" />
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <div className="error-msg">{errorMsg}</div>
      </div>
    );
  }

  if (stage === "generating-mirror") {
    return (
      <div className="page">
        <div className="interview-header">
          <div className="interview-day-label">第 {currentDay} 天</div>
          <div className="interview-phase">{phase.name}</div>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="question-block">
            <div className="question-num">— {i + 1}</div>
            <div className="question-text">{q}</div>
            <div className="answer-submitted">{answers[i]}</div>
          </div>
        ))}
        <LoadingDots text="正在生成今晚的镜子" />
      </div>
    );
  }

  if (stage === "mirror") {
    return (
      <div className="page">
        <div className="interview-header fade-in">
          <div className="interview-day-label">第 {currentDay} 天 · {phase.name}</div>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="question-block fade-in">
            <div className="question-num">— {i + 1}</div>
            <div className="question-text">{q}</div>
            <div className="answer-submitted">{answers[i]}</div>
          </div>
        ))}
        <div className="mirror-wrap">
          <div className="mirror-ornament">· · ·</div>
          <div className="mirror-text">{mirror}</div>
          <button className="btn-primary" style={{ maxWidth: 200, margin: "0 auto" }} onClick={onBack}>返回</button>
        </div>
      </div>
    );
  }

  const qIdx = parseInt(stage.replace("q", ""));
  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← 返回</button>
      <div className="interview-header fade-in">
        <div className="interview-day-label">第 {currentDay} 天</div>
        <div className="interview-phase">{phase.name}</div>
      </div>
      {questions.slice(0, qIdx).map((q, i) => (
        <div key={i} className="question-block fade-in">
          <div className="question-num">— {i + 1}</div>
          <div className="question-text">{q}</div>
          <div className="answer-submitted">{answers[i]}</div>
        </div>
      ))}
      {questions[qIdx] && (
        <div className="question-block fade-in">
          <div className="question-num">— {qIdx + 1}</div>
          <div className="question-text">{questions[qIdx]}</div>
          <textarea
            className="answer-input"
            placeholder="写下你的回答…"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="submit-btn-wrap">
            <button className="next-btn" disabled={!inputVal.trim()} onClick={submitAnswer}>
              {qIdx < 2 ? "下一个问题 →" : "完成今晚的访谈 →"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8, letterSpacing: "0.08em" }}>
            ⌘↵ 快速提交
          </div>
        </div>
      )}
    </div>
  );
}

// ── 历史页 ──
function HistoryPage({ data, onBack }) {
  const [expanded, setExpanded] = useState(null);
  const [backupCode, setBackupCode] = useState("");
  const [importVal, setImportVal] = useState("");
  const [importMsg, setImportMsg] = useState("");

  const maxDay = data.lastActiveDay;
  const displayDays = [];
  for (let i = 1; i <= Math.min(maxDay + 1, 30); i++) displayDays.push(i);

  const toggle = (day) => setExpanded(expanded === day ? null : day);

  const exportBackup = () => {
    const code = btoa(JSON.stringify(data));
    setBackupCode(code);
  };

  const importBackup = () => {
    try {
      const parsed = JSON.parse(atob(importVal.trim()));
      saveData(parsed);
      setImportMsg("恢复成功，请刷新页面。");
    } catch {
      setImportMsg("备份码无效，请重试。");
    }
  };

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← 返回</button>
      <div className="page-title fade-in">历史记录</div>

      {displayDays.length === 0 && (
        <div style={{ color: "var(--text-faint)", fontSize: 14, letterSpacing: "0.1em", lineHeight: 2 }}>
          还没有记录。今晚开始第一天？
        </div>
      )}

      {displayDays.map((day) => {
        const d = data.days[day];
        const phase = getPhase(day);
        const isExpanded = expanded === day;
        return (
          <div key={day} className="history-item fade-in" onClick={() => d?.completed && toggle(day)}>
            <div className="history-item-header">
              <div>
                <div className="history-day">第 {day} 天</div>
                <div className="history-phase">{phase.name}</div>
              </div>
              {d?.completed ? (
                <span className="history-status-done">已完成 {isExpanded ? "↑" : "↓"}</span>
              ) : (
                <span className="history-status-todo">未开始</span>
              )}
            </div>
            {isExpanded && d?.completed && (
              <div className="history-detail">
                {d.questions.map((q, i) => (
                  <div key={i} className="history-qa">
                    <div className="history-q">{q}</div>
                    <div className="history-a">{d.answers[i]}</div>
                  </div>
                ))}
                {d.mirror && <div className="history-mirror">{d.mirror}</div>}
              </div>
            )}
          </div>
        );
      })}

      <div className="backup-section">
        <div className="backup-title">数据备份 / 恢复</div>
        <div className="btn-row">
          <button className="btn-secondary" onClick={exportBackup}>生成备份码</button>
        </div>
        {backupCode && (
          <textarea
            className="backup-textarea"
            readOnly
            value={backupCode}
            style={{ marginTop: 12 }}
            onClick={(e) => e.target.select()}
          />
        )}
        <div style={{ marginTop: 20 }}>
          <textarea
            className="backup-textarea"
            placeholder="粘贴备份码以恢复数据…"
            value={importVal}
            onChange={(e) => setImportVal(e.target.value)}
          />
          <div className="btn-row">
            <button className="btn-secondary" onClick={importBackup}>恢复数据</button>
          </div>
          {importMsg && (
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8, letterSpacing: "0.08em" }}>
              {importMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 应用入口 ──
export default function App() {
  const [data, setData] = useState(() => loadData() || initData());
  const [page, setPage] = useState("welcome");
  const [showOnboarding, setShowOnboarding] = useState(() => !loadData());

  const updateData = useCallback((newData) => {
    setData(newData);
    saveData(newData);
  }, []);

  const handleStartOnboarding = () => {
    const fresh = initData();
    updateData(fresh);
    setShowOnboarding(false);
  };

  const handleCompleteDay = useCallback((day, phase, questions, answers, mirror, newSummary) => {
    setData((prev) => {
      const updated = {
        ...prev,
        lastActiveDay: day,
        historySummary: newSummary,
        days: {
          ...prev.days,
          [day]: {
            date: new Date().toISOString().slice(0, 10),
            phase,
            questions,
            answers,
            mirror,
            completed: true,
          },
        },
      };
      saveData(updated);
      return updated;
    });
  }, []);

  return (
    <>
      <style>{styles}</style>
      {showOnboarding && <OnboardingModal onStart={handleStartOnboarding} />}
      {page === "welcome" && (
        <WelcomePage
          data={data}
          onStartInterview={() => setPage("interview")}
          onGoHistory={() => setPage("history")}
        />
      )}
      {page === "interview" && (
        <InterviewPage
          data={data}
          onComplete={handleCompleteDay}
          onBack={() => setPage("welcome")}
        />
      )}
      {page === "history" && (
        <HistoryPage data={data} onBack={() => setPage("welcome")} />
      )}
    </>
  );
}