import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import fetch from "node-fetch";

initializeApp();

const API_KEY = "YOUR_FIREBASE_WEB_API_KEY"; // ضع هنا Web API Key من Firebase Console

export const loginUserV2 = onRequest(
    { region: "europe-west1" },
    async (req, res) => {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") return res.status(204).send("");

        if (req.method !== "POST") {
            return res.status(405).json({ error: "Only POST allowed" });
        }

        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: "Email and password are required",
                });
            }

            // 🔥 Firebase Identity Toolkit login REST API
            const response = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        password,
                        returnSecureToken: true,
                    }),
                }
            );

            const data = await response.json();

            if (data.error) {
                return res.status(400).json({
                    status: "error",
                    message: data.error.message,
                });
            }

            // 🔥 تسجيل الدخول ناجح
            return res.json({
                status: "success",
                idToken: data.idToken,
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn,
                localId: data.localId,
            });
        } catch (err) {
            return res.status(500).json({
                status: "error",
                message: err.message,
            });
        }
    }
);
