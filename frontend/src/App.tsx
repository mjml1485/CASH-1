import './App.css'
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import { useEffect } from "react";

function LandingRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited) {
      localStorage.setItem("hasVisited", "1");
      navigate("/signup", { replace: true });
    } else {
      navigate("/signin", { replace: true });
    }
  }, [navigate]);
  return null;
}

function App() {
  return (
    <div id="app-root">
      <BrowserRouter>
        <main>
          <Routes>
            <Route path="/" element={<LandingRedirect />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
