import axios from "axios";

const API = axios.create({
  baseURL: "https://timizamkopo-ke.vercel.app",
  headers: {
    "Content-Type": "application/json",
  },
});


export default API;