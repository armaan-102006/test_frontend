// src/components/Terminal.jsx
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  "https://8603-152-59-81-162.ngrok-free.app 
";

export default function TerminalComponent({ sessionId, onDisconnect }) {
  const terminalDivRef = useRef(null);
  const termRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: { background: "#0d1318", foreground: "#00ffaa" },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalDivRef.current);
    fitAddon.fit();
    termRef.current = term;

    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    const decoder = new TextDecoder();
    const writePayload = (payload) => {
      if (payload == null) return;
      if (typeof payload === "string") {
        term.write(payload);
        return;
      }
      if (payload instanceof ArrayBuffer) {
        term.write(decoder.decode(new Uint8Array(payload)));
        return;
      }
      if (ArrayBuffer.isView(payload)) {
        term.write(decoder.decode(payload));
        return;
      }
      term.write(String(payload));
    };

    socket.on("connect", () => term.writeln("✅ Connected to your container..."));
    socket.on("result", (payload) => writePayload(payload));
    socket.on("disconnect", () => {
      term.writeln("\r\n❌ Session ended.");
      if (onDisconnect) onDisconnect();
    });
    socket.on("connect_error", () =>
      term.writeln("\r\n⚠️ Connection error. Is backend running?")
    );

    term.onData((data) => {
      if (socket.connected) socket.emit("recieve_data", data);
    });

    return () => {
      socket.disconnect();
      term.dispose();
    };
  }, [sessionId, onDisconnect]);

  return (
    <div
      ref={terminalDivRef}
      style={{ height: "450px", width: "100%", borderRadius: "8px", overflow: "hidden" }}
    />
  );
}
