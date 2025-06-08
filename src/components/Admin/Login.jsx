import Alert from "./Panels/Modal/Alert";
import React, { useState, useEffect, useRef } from "react";
import Logo from "../Assets/logo.png";
import "../Styles/sLogin.css";
import LeftBg1 from "../Assets/login/login_img1.jpeg";
import LeftBg2 from "../Assets/login/login_img2.jpeg";
import LeftBg3 from "../Assets/login/login_img3.jpeg";
import LeftBg4 from "../Assets/login/login_img4.jpeg";
import LeftBg5 from "../Assets/login/login_img5.jpeg";
import Hide from "../Assets/show.png";
import Show from "../Assets/hide.png";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function validateEmailFormat(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const sliderImages = [LeftBg1, LeftBg2, LeftBg3, LeftBg4, LeftBg5];

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 60 * 1000; // 60 seconds in ms

const getLockoutInfo = () => {
    // Read from localStorage, fallback to defaults
    const failed = parseInt(localStorage.getItem('login_failed_attempts') || "0", 10);
    const until = parseInt(localStorage.getItem('login_locked_until') || "0", 10);
    return { failed, until };
};
const setLockoutInfo = (failed, until = 0) => {
    localStorage.setItem('login_failed_attempts', failed);
    if (until) {
        localStorage.setItem('login_locked_until', until);
    } else {
        localStorage.removeItem('login_locked_until');
    }
};

const REMEMBER_EMAIL_KEY = "remember_me_email";
const REMEMBER_ME_KEY = "remember_me_checked";

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [alert, setAlert] = useState({ open: false, message: "", type: "success" });
    const [errors, setErrors] = useState({});
    const [currentSlide, setCurrentSlide] = useState(0);
    const [lockout, setLockout] = useState({ locked: false, secondsLeft: 0 });

    const sliderTimeout = useRef(null);
    const countdownInterval = useRef(null);
    const navigate = useNavigate();

    // Slider animation
    useEffect(() => {
        sliderTimeout.current = setTimeout(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 3500);
        return () => clearTimeout(sliderTimeout.current);
    }, [currentSlide]);

    useEffect(() => {
        axios.get("https://ibayanihub-backend.onrender.com/api/getAdmin")   
            .then((response) => setAdmins(response.data))
            .catch(() => {});
    }, []);

    // On mount: check for lockout and "remember me"
    useEffect(() => {
        const { until } = getLockoutInfo();
        if (until && Date.now() < until) {
            startCountdown(until - Date.now());
        }
        // Remember Me
        const remembered = localStorage.getItem(REMEMBER_ME_KEY) === "true";
        const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
        if (remembered && rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    // Countdown for lockout
    const startCountdown = (duration) => {
        // Duration in ms
        let end = Date.now() + duration;
        setLockout({ locked: true, secondsLeft: Math.ceil(duration / 1000) });
        setAlert({
            open: true,
            message: `Too many failed attempts. Please wait ${Math.ceil(duration / 1000)} seconds.`,
            type: "error"
        });
        countdownInterval.current && clearInterval(countdownInterval.current);
        countdownInterval.current = setInterval(() => {
            const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
            setLockout({ locked: left > 0, secondsLeft: left });
            setAlert({
                open: true,
                message: `Too many failed attempts. Please wait ${left} seconds.`,
                type: "error"
            });
            if (left <= 0) {
                clearInterval(countdownInterval.current);
                setAlert({ open: false, message: "", type: "success" });
                setLockout({ locked: false, secondsLeft: 0 });
                setLockoutInfo(0, 0); // Reset lockout info
            }
        }, 1000);
    };

    useEffect(() => {
        return () => {
            countdownInterval.current && clearInterval(countdownInterval.current);
        };
    }, []);

    const validate = () => {
        const newErrors = {};
        if (!email) {
            newErrors.email = "Email is Required";
        } else if (!validateEmailFormat(email)) {
            newErrors.email = "Please enter a valid email address";
        }
        if (!password) {
            newErrors.password = "Password is Required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        // Check if locked
        const { until, failed } = getLockoutInfo();
        if (until && Date.now() < until) {
            // Already locked
            startCountdown(until - Date.now());
            return;
        }

        // Field-level validation first
        if (!validate()) return;

        // Save/removal for remember me
        if (rememberMe) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, email);
            localStorage.setItem(REMEMBER_ME_KEY, "true");
        } else {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
            localStorage.setItem(REMEMBER_ME_KEY, "false");
        }

        try {
            const response = await axios.post("https://ibayanihubweb-backend.onrender.com/api/login", {
                email,
                password
            });

            // Success: reset fail counter
            setLockoutInfo(0, 0);

            const admin = response.data.admin;
            localStorage.setItem('adminEmail', admin.admin_email);

            await axios.post("https://ibayanihubweb-backend.onrender.com/api/setAdminStatus", {
                email: admin.admin_email,
                status: true
            });

            setAlert({ open: true, message: "Admin Login Successfully!", type: "success" });
            setTimeout(() => navigate('/main'), 1200);

        } catch (error) {
            // Only show alert for login fail, not input errors
            if (email && password && validateEmailFormat(email)) {
                // Increment failed attempts
                let { failed } = getLockoutInfo();
                failed = isNaN(failed) ? 0 : failed;
                failed += 1;
                if (failed >= LOCKOUT_THRESHOLD) {
                    // Lockout
                    const until = Date.now() + LOCKOUT_DURATION;
                    setLockoutInfo(failed, until);
                    startCountdown(LOCKOUT_DURATION);
                    return;
                } else {
                    setLockoutInfo(failed, 0);
                }
                setAlert({ open: true, message: `Account does not Exist. ${LOCKOUT_THRESHOLD - failed} attempts left.`, type: "error" });
            } else {
                const message = error.response?.data?.message || "Login failed.";
                setAlert({ open: true, message, type: "error" });
            }
        }
    };

    const togglePassword = () => setShowPassword((prev) => !prev);

    const handleInput = (setter, field) => (e) => {
        setter(e.target.value);
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const handleRememberChange = (e) => {
        setRememberMe(e.target.checked);
        if (!e.target.checked) {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
            localStorage.setItem(REMEMBER_ME_KEY, "false");
        }
    };

    return (
        <div id="login-container">
            <Alert
                message={alert.open ? alert.message : ""}
                type={alert.type}
                onClose={() => setAlert({ ...alert, open: false })}
                duration={lockout.locked ? 999999 : 2500}
            />
            <div id="left-container">
                <div className="slider-wrapper">
                    {sliderImages.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt={`Slide ${idx + 1}`}
                            className={`slider-img${idx === currentSlide ? " active" : ""}`}
                            style={{ zIndex: idx === currentSlide ? 2 : 1 }}
                        />
                    ))}
                    <div className="slider-dots">
                        {sliderImages.map((_, idx) => (
                            <div
                                key={idx}
                                className={`slider-dot${idx === currentSlide ? " active" : ""}`}
                                onClick={() => setCurrentSlide(idx)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div id="right-container">
                <div id="forms-container">
                    <div id="upperForms-container">
                        <div id="logo-container">
                            <img src={Logo} alt="Logo Error" id="logo"/>
                            <div id="title-container">
                                <h2 id="title-text">i</h2>
                                <h2 id="title-text1">Bayani</h2>
                                <h2 id="title-text">Hub</h2>
                            </div>
                        </div>
                        <div id="slogan-container">
                            <p id="slogan-text">Giving Together, <span>Growing Together.</span></p>
                        </div>
                    </div>

                    <form id="lowerForms-container" onSubmit={handleLogin} autoComplete="off">
                        <div id="input-container">
                            <label id="forms-label">Email</label><br/>
                            <input 
                                id="forms-input" 
                                className={errors.email ? "input-error" : ""}
                                placeholder="Enter your Email" 
                                value={email}
                                onChange={handleInput(setEmail, "email")}
                                disabled={lockout.locked}
                                autoComplete="username"
                            />
                            {errors.email && <div className="input-error-text">{errors.email}</div>}
                        </div>
                        <div id="input-container">
                            <label id="forms-label">Password</label><br/>
                            <div id="password-container">
                                <input 
                                    id="forms-input" 
                                    className={errors.password ? "input-error" : ""}
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter your Password"
                                    value={password}
                                    onChange={handleInput(setPassword, "password")}
                                    disabled={lockout.locked}
                                    autoComplete="current-password"
                                />
                                <img src={showPassword ? Hide : Show} alt="Error Icon"s id="pass-icon" onClick={togglePassword}/>
                            </div>
                            {errors.password && <div className="input-error-text">{errors.password}</div>}
                        </div>
                        <div id="forgot-container" style={{ justifyContent: 'space-between', alignItems: 'center', display: 'flex', width: '70%', margin: '0 auto 6%' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    id="remember-me"
                                    checked={rememberMe}
                                    onChange={handleRememberChange}
                                    disabled={lockout.locked}
                                    style={{ marginRight: '6px' }}
                                />
                                <label htmlFor="remember-me" style={{ fontFamily: 'Poppins-Reg', fontSize: '14px', color: '#141414', cursor: lockout.locked ? "not-allowed" : "pointer" }}>
                                    Remember Me
                                </label>
                            </div>
                        </div>
                        <div id="button-container">
                            <button id="forms-button" type="submit" disabled={lockout.locked}>Login</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login;