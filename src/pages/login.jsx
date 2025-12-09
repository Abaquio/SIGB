import React, { useState } from "react"
import styled from "styled-components"
import { useNavigate } from "react-router-dom"

import logo from "../assets/totem-logo.png"
import fondo from "../assets/fondo-login.jpg"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

const LoginPage = ({ setUsuario }) => {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError(null)

    if (!email || !password) {
      setError("Debes ingresar tu correo y contraseña.")
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Credenciales inválidas.")
        return
      }

      // Guardar sesión en localStorage
      localStorage.setItem("usuario", JSON.stringify(data.usuario))

      // Si App.jsx pasó setUsuario, actualizamos el estado global
      if (typeof setUsuario === "function") {
        setUsuario(data.usuario)
      }

      // Ir al dashboard
      navigate("/inicio", { replace: true })
    } catch (err) {
      console.error(err)
      setError("Error de conexión con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleLogin()
  }

  return (
    <StyledWrapper>
      {/* Lado izquierdo: imagen de fondo */}
      <div className="left">
        <img src={fondo} className="bg-img" alt="Fondo login Totem" />
      </div>

      {/* Lado derecho: tarjeta de login */}
      <div className="right">
        <div className="card">
          <img src={logo} alt="Totem" className="logo" />
          <h4 className="title">Iniciar sesión</h4>

          <form onSubmit={handleSubmit}>
            <label className="field" htmlFor="logemail">
              <span className="input-icon">@</span>
              <input
                autoComplete="off"
                id="logemail"
                placeholder="Correo electrónico"
                className="input-field"
                name="logemail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="field" htmlFor="logpass">
              <svg
                className="input-icon"
                viewBox="0 0 500 500"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M80 192V144C80 64.47 144.5 0 224 0C303.5 0 368 64.47 368 144V192H384C419.3 192 448 220.7 448 256V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V256C0 220.7 28.65 192 64 192H80zM144 192H304V144C304 99.82 268.2 64 224 64C179.8 64 144 99.82 144 144V192z" />
              </svg>
              <input
                autoComplete="off"
                id="logpass"
                placeholder="Contraseña"
                className="input-field"
                name="logpass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p className="error">{error}</p>}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  background: #0f0f11;
  color: #ffeba7;

  .left {
    flex: 1;
    overflow: hidden;
  }

  .bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .card {
    --main-col: #ffeba7;
    --bg-col: #2a2b38;
    --bg-field: #1f2029;

    width: 330px;
    padding: 2.4rem 2.2rem;
    text-align: center;
    background: var(--bg-col);
    border-radius: 12px;
    border: 1px solid var(--main-col);
    user-select: none;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45);
  }

  .logo {
    width: 110px;
    margin-bottom: 1.2rem;
  }

  .title {
    margin-bottom: 1rem;
    font-size: 1.6em;
    font-weight: 700;
    color: var(--main-col);
  }

  form {
    margin-top: 0.5rem;
  }

  .field {
    margin-top: 0.8rem;
    display: flex;
    align-items: center;
    padding-left: 0.5rem;
    gap: 0.5rem;
    background-color: var(--bg-field);
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px rgba(255, 235, 167, 0.1);
  }

  .input-icon {
    width: 1em;
    color: var(--main-col);
    fill: var(--main-col);
  }

  .input-field {
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    color: var(--main-col);
    padding: 0.6em 1em;
  }

  .btn {
    margin-top: 1.5rem;
    padding: 0.7em 1.5em;
    width: 100%;
    font-weight: bold;
    background-color: var(--main-col);
    border: none;
    border-radius: 6px;
    color: var(--bg-col);
    cursor: pointer;
    transition: 0.3s ease;
    box-shadow: 0 6px 18px rgba(255, 235, 167, 0.35);
  }

  .btn:hover {
    background-color: var(--bg-field);
    color: var(--main-col);
    box-shadow: 0 8px 24px 0 rgb(16 39 112 / 20%);
  }

  .error {
    margin-top: 0.8rem;
    font-size: 0.8rem;
    color: #ff6b6b;
    text-align: left;
  }

  @media (max-width: 900px) {
    .left {
      display: none;
    }
    .right {
      flex: 1;
    }
  }
`

export default LoginPage
