import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import Login from "./Login";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect, useRef } from "react";
import "./styles/global.css";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  /* ================= DATES ================= */
  const getISODate = (d = new Date()) => d.toISOString().split("T")[0];
  const [today, setToday] = useState(getISODate());
  const yesterday = getISODate(new Date(Date.now() - 86400000));

  useEffect(() => {
    const timer = setInterval(() => {
      const now = getISODate();
      setToday(prev => (prev !== now ? now : prev));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDateLabel = (date) => {
    if (date === today) return "Today";
    if (date === yesterday) return "Yesterday";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  /* ================= CHAT ================= */
  const [chatHistory, setChatHistory] = useState({});
  const [activeDate, setActiveDate] = useState(today);

  // 🔒 LOAD ALL DAYS (NO UI CHANGES)
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          profile: {
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || ""
          }
        });
      }

      const historyRef = collection(db, "users", user.uid, "chatHistory");
      const daysSnap = await getDocs(historyRef);

      const days = {};
      daysSnap.forEach(d => {
        days[d.id] = d.data().messages || [];
      });

      if (!days[today]) {
        await setDoc(doc(db, "users", user.uid, "chatHistory", today), { messages: [] });
        days[today] = [];
      }

      setChatHistory(days);
      setActiveDate(today);
    };

    load();
  }, [user, today]);

  // SAVE ONLY TODAY
  useEffect(() => {
    if (!user || !chatHistory[today]) return;
    setDoc(doc(db, "users", user.uid, "chatHistory", today), {
      messages: chatHistory[today]
    });
  }, [chatHistory, user, today]);

  const messages = chatHistory[activeDate] || [];

  const sendToAI = async (text) => {
    const res = await fetch("https://fluid-stylus-packaging-abs.trycloudflare.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        message: text,
        date: activeDate
      })
    });
    const data = await res.json();
    return data.reply;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (activeDate !== today) return;

    const val = e.target.msg.value.trim();
    if (!val) return;

    setChatHistory(prev => ({
      ...prev,
      [today]: [...(prev[today] || []), { sender: "user", text: val }]
    }));

    e.target.reset();

    setChatHistory(prev => ({
      ...prev,
      [today]: [...(prev[today] || []), { sender: "ai", text: "Thinking...", thinking: true }]
    }));

    const aiReply = await sendToAI(val);

    setChatHistory(prev => {
      const updated = [...(prev[today] || [])];
      const i = updated.map(m => m.thinking).lastIndexOf(true);
      if (i !== -1) updated[i] = { sender: "ai", text: aiReply };
      return { ...prev, [today]: updated };
    });
  };

  const sortedDates = Object.keys(chatHistory).sort((a, b) => b.localeCompare(a));

  /* ================= UI STATE ================= */
  const [activePanel, setActivePanel] = useState(null);
  const [screen, setScreen] = useState("chat");

  /* ================= PROFILE ================= */
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    email: "",
    avatar: null
  });

  useEffect(() => {
  if (!user) return;

  setProfile(prev => ({
    ...prev,
    name: user.displayName || prev.name || "",
    email: user.email || prev.email || "",
    avatar: prev.avatar ?? user.photoURL ?? ""
  }));
}, [user]);


  const [editedAvatar, setEditedAvatar] = useState(null);
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const fileInputRef = useRef();

  const handleAvatarPick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditedAvatar(URL.createObjectURL(file));
    setIsProfileDirty(true);
  };

  const saveProfile = () => {
    if (!isProfileDirty) return;
    setProfile(prev => ({ ...prev, avatar: editedAvatar }));
    setIsProfileDirty(false);
  };

  if (!user) return <Login onLogin={setUser} />;

  /* ================= PROFILE SCREEN ================= */
  /* ================= PROFILE SCREEN ================= */
if (screen === "profile") {
  return (
    <div className="profile-screen">
      <button className="profile-back" onClick={() => setScreen("chat")}>
        Back
      </button>

      <div className="profile-avatar-wrap">
        <div
  className="profile-avatar"
  style={{
    backgroundImage: `url(${editedAvatar || profile.avatar || user.photoURL || ""})`,
    backgroundSize: "cover",
    backgroundPosition: "center"
  }}
>
  {!editedAvatar && !profile.avatar && !user.photoURL &&
    ((user.displayName || user.email || "U")[0].toUpperCase())}
</div>




        <button
          className="avatar-edit-btn"
          onClick={() => fileInputRef.current.click()}
        >
          ✎
        </button>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleAvatarPick}
        />
      </div>

      <div className="profile-card">
        <div>
          <span>Name</span>
          <span>{profile.name || "—"}</span>
        </div>
        <div>
          <span>Age</span>
          <span>{profile.age || "—"}</span>
        </div>
        <div>
          <span>Gender</span>
          <span>{profile.gender || "—"}</span>
        </div>
        <div>
          <span>Email</span>
          <span>{profile.email || "—"}</span>
        </div>
      </div>

      <button
        className={`profile-save ${isProfileDirty ? "active" : ""}`}
        disabled={!isProfileDirty}
        onClick={saveProfile}
      >
        Save
      </button>
    </div>
  );
}


  /* ================= CHAT UI ================= */
  return (
    <div className="app">
      <div className="header">
        <div className="menu" onClick={() => setActivePanel("history")}>☰</div>
        <div className="title">AI Therapist</div>

        <div
  className="dp"
  onClick={() => setActivePanel("profile")}
  style={{
    backgroundImage: user.photoURL ? `url(${user.photoURL})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center"
  }}
>
  {!user.photoURL &&
    ((user.displayName || user.email || "U")[0].toUpperCase())}
</div>


      </div>

      <div className="rgb-bar" />

      <div className="chat-viewport">
        <div className="chat-area">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.sender} ${m.thinking ? "thinking" : ""}`}>
              {m.text}
            </div>
          ))}
        </div>

        {/* HISTORY PANEL */}
        <div className={`history-panel ${activePanel === "history" ? "open" : ""}`}>
          <div className="history-header">
            <button onClick={() => setActivePanel(null)}>Back</button>
          </div>
          <div className="history-list">
            {sortedDates.map(d => (
              <div key={d} className="dp-item"
                onClick={() => { setActiveDate(d); setActivePanel(null); }}>
                {formatDateLabel(d)}
              </div>
            ))}
          </div>
        </div>

        {/* DP PANEL */}
        <div className={`dp-panel ${activePanel === "profile" ? "open" : ""}`}>
          <button onClick={() => setActivePanel(null)}>Back</button>
          <div className="dp-item" onClick={() => { setScreen("profile"); setActivePanel(null); }}>
            Profile
          </div>
          <div className="dp-item">Settings</div>
          <div className="dp-item">Subscription</div>
          <div className="dp-item">Logout</div>
        </div>
      </div>

      <form className="input-bar" onSubmit={sendMessage}>
        <input
          name="msg"
          placeholder={activeDate === today ? "Type your message..." : "Read only chat"}
          disabled={activeDate !== today}
        />
        <button disabled={activeDate !== today}>➤</button>
      </form>
    </div>
  );
}
