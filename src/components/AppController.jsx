import React from "react"
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import Login from './Admin/Login'
import Main from './Admin/Main'

const AppController = () => {
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/main" element={<Main />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppController