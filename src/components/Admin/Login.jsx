import React, { useState, useEffect } from "react";
import Logo from "../Assets/logo.png";
import "../Styles/sLogin.css";
import LeftBg from "../Assets/login-lbg.png";
import Show from "../Assets/show.png";
import Hide from "../Assets/hide.png";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [admins, setAdmins] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("https://ibayanihub-backend.onrender.com/api/getAdmin")   
            .then((response) => setAdmins(response.data))
            .catch((error) => {
                console.log("Error fetching admins:", error);
            });
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
    
        if (!email || !password) {
            alert('Please fill in both Email and Password.');
            return;
        }
    
        try {
            const response = await axios.post("https://ibayanihubweb-backend.onrender.com/api/login", {
                email,
                password
            });
    
            const admin = response.data.admin;
    
            // Store admin email
            localStorage.setItem('adminEmail', admin.admin_email);
    
            // Set status to online
            await axios.post("https://ibayanihubweb-backend.onrender.com/api/setAdminStatus", {
                email: admin.admin_email,
                status: true
            });
    
            alert('Admin Login Successfully!');
            navigate('/main');
    
        } catch (error) {
            console.error("Login error:", error);
    
            const message = error.response?.data?.message || "Login failed.";
            alert(message); // handles invalid credentials and lockout message
        }
    };

    const togglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div id="login-container">
            <div id="left-container">
                <img src={LeftBg} alt="Left Background Error" id="leftbg-img" />
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

                    <form id="lowerForms-container" onSubmit={handleLogin}>
                        <div id="input-container">
                            <label id="forms-label">Email</label><br/>
                            <input 
                                id="forms-input" 
                                type="email" 
                                placeholder="Enter your Email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div id="input-container">
                            <label id="forms-label">Password</label><br/>
                            <div id="password-container">
                                <input 
                                    id="forms-input" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter your Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <img src={showPassword ? Hide : Show} alt="Error Icon" id="pass-icon" onClick={togglePassword}/>
                            </div>
                        </div>
                        <div id="forgot-container">
                            <label id="forms-textForgot">Forgot Password?</label>
                        </div>
                        <div id="button-container">
                            <button id="forms-button" type="submit">Login</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login;
